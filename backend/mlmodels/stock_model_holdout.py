import pandas as pd
import numpy as np
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import matplotlib
matplotlib.use('Agg') # Crucial for web server environments
import matplotlib.pyplot as plt
import io
import base64
from .stock_data import StockData

class StockModelHoldout:
    def __init__(self, stock_data):
        """
        Initialize StockModelHoldout with StockData object.
        
        Args:
            stock_data (StockData): StockData object containing the stock data
        """
        if not isinstance(stock_data, StockData):
            raise ValueError("Input must be a StockData object")
            
        self.stock_data = stock_data
        self.train_data = None
        self.test_data = None
        self.model = None
        self.forecast = None
        self.metrics = None
        
    def split_data(self, test_size=0.2):
        """
        Split the data into training and testing sets.
        
        Args:
            test_size (float): Proportion of data to use for testing (default: 0.2)
        """
        if self.stock_data.dataframe is None or self.stock_data.dataframe.empty:
            raise ValueError("No data available. Please fetch data first.")
            
        # Sort data by date and copy to avoid SettingWithCopy warnings
        df = self.stock_data.dataframe.sort_values('Date').copy()
        
        # Calculate split index
        split_idx = int(len(df) * (1 - test_size))
        
        # Split the data
        self.train_data = df.iloc[:split_idx].copy()
        self.test_data = df.iloc[split_idx:].copy()
        
        # Prepare data for Prophet (rename columns)
        self.train_data = self.train_data.rename(columns={'Date': 'ds', 'Close': 'y'})
        self.test_data = self.test_data.rename(columns={'Date': 'ds', 'Close': 'y'})

        # Remove timezone information if present to prevent Prophet errors
        if self.train_data['ds'].dt.tz is not None:
             self.train_data['ds'] = self.train_data['ds'].dt.tz_localize(None)
        if self.test_data['ds'].dt.tz is not None:
             self.test_data['ds'] = self.test_data['ds'].dt.tz_localize(None)
        
    def train_model(self):
        """
        Train the Prophet model on the training data.
        """
        if self.train_data is None:
            raise ValueError("No training data available. Please split data first.")
            
        # Initialize and fit the model
        self.model = Prophet()
        self.model.fit(self.train_data)
        
    def make_forecast(self):
        """
        Make forecasts on the test data.
        """
        if self.model is None:
            raise ValueError("No trained model available. Please train the model first.")
            
        # Create future dataframe for test dates
        future = self.test_data[['ds']]
        
        # Make predictions
        self.forecast = self.model.predict(future)
        
    def calculate_metrics(self):
        """
        Calculate performance metrics for the forecast.
        """
        if self.forecast is None:
            raise ValueError("No forecast available. Please make forecast first.")
            
        # Extract actual and predicted values
        y_true = self.test_data['y'].values
        y_pred = self.forecast['yhat'].values
        
        # Calculate metrics
        self.metrics = {
            'MAE': mean_absolute_error(y_true, y_pred),
            'MSE': mean_squared_error(y_true, y_pred),
            'RMSE': np.sqrt(mean_squared_error(y_true, y_pred)),
            'R2': r2_score(y_true, y_pred)
        }
        
    def visualize_forecast(self, save_path=None):
        """
        Visualize the actual vs predicted values.
        - If save_path is provided: saves image to disk.
        - If NO save_path: returns Base64 string (for web display).
        """
        if self.forecast is None:
            return None
            
        try:
            plt.style.use('seaborn-v0_8')
            
            # Create the plot
            fig = plt.figure(figsize=(12, 6))
            
            # Plot actual values
            plt.plot(self.test_data['ds'], self.test_data['y'], 
                    label='Actual', color='blue', linewidth=2)
            
            # Plot predicted values
            plt.plot(self.test_data['ds'], self.forecast['yhat'], 
                    label='Predicted', color='red', linestyle='--', linewidth=2)
            
            # Add confidence intervals
            plt.fill_between(self.test_data['ds'], 
                           self.forecast['yhat_lower'], 
                           self.forecast['yhat_upper'],
                           color='gray', alpha=0.2, label='Confidence Interval')
            
            # Customize the plot
            plt.title(f'{self.stock_data.ticker} Stock Price: Actual vs Predicted')
            plt.xlabel('Date')
            plt.ylabel('Price')
            plt.legend()
            plt.grid(True)
            
            # Rotate x-axis labels for better readability
            plt.xticks(rotation=45)
            
            # Adjust layout
            plt.tight_layout()
            
            # --- WEB LOGIC ---
            if save_path:
                plt.savefig(save_path)
                print(f"Visualization saved to {save_path}")
                plt.close()
                return None
            else:
                buf = io.BytesIO()
                plt.savefig(buf, format='png')
                buf.seek(0)
                image_base64 = base64.b64encode(buf.read()).decode('utf-8')
                plt.close()
                return image_base64
            
        except Exception as e:
            print(f"Error creating visualization: {str(e)}")
            return None
        
    def run_analysis(self, test_size=0.2):
        """
        Run the complete analysis pipeline.
        
        Args:
            test_size (float): Proportion of data to use for testing (default: 0.2)
        """
        self.split_data(test_size)
        self.train_model()
        self.make_forecast()
        self.calculate_metrics()
        
        return self.metrics

# Example usage
if __name__ == "__main__":
    # Create StockData object
    try:
        stock_data = StockData(
            ticker="GOOG",
            start_date="2023-01-01",
            end_date="2025-12-31"
        )
        
        # Fetch the data
        stock_data.fetch_closing_prices()
        
        # Create and run the model
        model = StockModelHoldout(stock_data)
        metrics = model.run_analysis()
        
        # Print the results
        print("\nModel Performance Metrics:")
        for metric, value in metrics.items():
            print(f"{metric}: {value:.4f}")
            
        # Create visualization (Local test)
        model.visualize_forecast("holdout_test.png")
        
    except Exception as e:
        print(f"Test failed: {e}")