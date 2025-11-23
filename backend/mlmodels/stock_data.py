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
        
        Args:
            ticker (str): Stock ticker symbol (e.g., 'RELIANCE' or 'RELIANCE.NS')
            start_date (str): Start date in 'YYYY-MM-DD' format
            end_date (str): End date in 'YYYY-MM-DD' format
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
            # 1. Try fetching exactly what was asked (e.g. "RELIANCE.NS" or "AAPL")
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

    def visualize_data(self, save_path=None):
        """
        Create visualization.
        - If save_path is provided: saves to disk (for testing).
        - If NO save_path: returns Base64 string (for React/Web).
        """
        if self.dataframe is None:
            return None
            
        try:
            # Set style
            plt.style.use('seaborn-v0_8')
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
            
            # Plot 1: Price
            sns.lineplot(data=self.dataframe, x='Date', y='Close', ax=ax1)
            ax1.set_title(f'{self.ticker} Closing Price Over Time')
            ax1.set_ylabel('Price (INR/USD)')
            ax1.grid(True)
            
            # Plot 2: Daily Returns
            self.dataframe['Daily_Return'] = self.dataframe['Close'].pct_change()
            sns.histplot(data=self.dataframe.dropna(), x='Daily_Return', bins=50, ax=ax2)
            ax2.set_title(f'{self.ticker} Daily Returns Distribution')
            ax2.grid(True)
            
            plt.tight_layout()
            
            # --- WEB INTEGRATION LOGIC ---
            if save_path:
                # Save to file (Local testing)
                plt.savefig(save_path)
                print(f"Visualization saved to {save_path}")
                plt.close()
                return None
            else:
                # Return Base64 (For React Frontend)
                buf = io.BytesIO()
                plt.savefig(buf, format='png')
                buf.seek(0)
                image_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close()
                return image_base64
            
        except Exception as e:
            print(f"Error creating visualization: {str(e)}")
            return None

# Example usage for testing
if __name__ == "__main__":
    try:
        # Test with an Indian stock name without extension
        stock = StockData("RELIANCE", "2023-01-01", "2025-12-31")
        stock.fetch_closing_prices()
        print("Data fetched successfully.")
        
        # Test generating an image file
        stock.visualize_data("reliance_test.png")
        
    except Exception as e:
        print(f"Test failed: {e}")