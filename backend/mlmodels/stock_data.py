import yfinance as yf
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Crucial for running on a web server (no GUI)
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import io
import base64

class StockData:
    def __init__(self, ticker, start_date, end_date):
        """
        Initialize a StockData object with ticker and date range.
        """
        self.ticker = ticker.upper().strip() # Clean the input
        self.start_date = start_date
        self.end_date = end_date
        self.dataframe = None
        
        # Validate date formats immediately
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            if end < start:
                raise ValueError("End date must be after start date")
        except ValueError as e:
            raise ValueError(f"Invalid date format. Dates must be in YYYY-MM-DD format. Error: {str(e)}")

    def fetch_closing_prices(self):
        """
        Fetch closing prices. Tries the raw ticker first, then appends .NS if that fails/is empty.
        """
        try:
            # 1. Try fetching exactly what was asked
            data = self._download_data(self.ticker)
            
            # 2. If empty, and it doesn't have a suffix, try appending .NS (Indian NSE default)
            if data.empty and '.' not in self.ticker:
                print(f"No data for {self.ticker}, trying {self.ticker}.NS ...")
                data = self._download_data(f"{self.ticker}.NS")
                if not data.empty:
                    self.ticker = f"{self.ticker}.NS" # Update ticker to the correct one

            if data.empty:
                raise ValueError(f"No data found for ticker {self.ticker}. Is the symbol correct?")
            
            # Process Data
            self.dataframe = data[['Close']].reset_index()
            self.dataframe.columns = ['Date', 'Close']
            
            # Clean timezone info if present to avoid Prophet errors later
            if self.dataframe['Date'].dt.tz is not None:
                self.dataframe['Date'] = self.dataframe['Date'].dt.tz_localize(None)

            print(f"Successfully fetched {len(self.dataframe)} rows for {self.ticker}")
            
        except Exception as e:
            raise ValueError(f"Error fetching stock data: {str(e)}")

    def _download_data(self, symbol):
        """Helper to download data"""
        return yf.download(symbol, start=self.start_date, end=self.end_date, progress=False)

    def get_price_plot(self):
        """
        Generates Image 1: Closing Price History
        """
        if self.dataframe is None: return None
        
        try:
            plt.style.use('seaborn-v0_8')
            plt.figure(figsize=(10, 6))
            
            sns.lineplot(data=self.dataframe, x='Date', y='Close', color='blue')
            plt.title(f'{self.ticker} Closing Price History')
            plt.xlabel('Date')
            plt.ylabel('Price (INR)')
            plt.grid(True)
            plt.tight_layout()
            
            return self._fig_to_base64()
        except Exception as e:
            print(f"Error generating price plot: {e}")
            return None

    def get_returns_plot(self):
        """
        Generates Image 2: Daily Returns Distribution
        """
        if self.dataframe is None: return None
        
        try:
            plt.style.use('seaborn-v0_8')
            plt.figure(figsize=(10, 6))
            
            # Calculate returns if not already present
            if 'Daily_Return' not in self.dataframe.columns:
                self.dataframe['Daily_Return'] = self.dataframe['Close'].pct_change()
            
            sns.histplot(data=self.dataframe.dropna(), x='Daily_Return', bins=50, color='purple', kde=True)
            plt.title(f'{self.ticker} Daily Returns Distribution')
            plt.xlabel('Daily Return')
            plt.ylabel('Frequency')
            plt.grid(True)
            plt.tight_layout()
            
            return self._fig_to_base64()
        except Exception as e:
            print(f"Error generating returns plot: {e}")
            return None

    def _fig_to_base64(self):
        """Helper to convert current plot to base64 string"""
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close()
        return image_base64

# Example usage for testing
if __name__ == "__main__":
    try:
        stock = StockData("RELIANCE", "2023-01-01", "2025-12-31")
        stock.fetch_closing_prices()
        
        # Test distinct images
        print(f"Price Plot Base64 len: {len(stock.get_price_plot() or '')}")
        print(f"Returns Plot Base64 len: {len(stock.get_returns_plot() or '')}")
        
    except Exception as e:
        print(f"Test failed: {e}")