import pandas as pd
import numpy as np
from prophet import Prophet
from hyperopt import fmin, tpe, hp, STATUS_OK, Trials
import matplotlib
matplotlib.use('Agg') # Crucial for web server
import matplotlib.pyplot as plt
import io
import base64
from .stock_data import StockData

class StockHyperopt:
    def __init__(self, stock_data):
        """
        Initialize StockHyperopt with StockData object.
        
        Args:
            stock_data (StockData): StockData object containing the stock data
        """
        if not isinstance(stock_data, StockData):
            raise ValueError("Input must be a StockData object")
            
        self.stock_data = stock_data
        self.model = None
        self.best_params = None
        self.forecast = None
        self.df = None # Initialize df attribute
        
    def prepare_data(self):
        """
        Prepare data for Prophet model.
        """
        if self.stock_data.dataframe is None or self.stock_data.dataframe.empty:
            raise ValueError("No data available. Please fetch data first.")
            
        # Sort data by date
        self.df = self.stock_data.dataframe.sort_values('Date').copy()
        
        # Prepare data for Prophet (rename columns)
        self.df = self.df.rename(columns={'Date': 'ds', 'Close': 'y'})
        
        # Ensure ds is timezone-naive to prevent Prophet errors
        if self.df['ds'].dt.tz is not None:
            self.df['ds'] = self.df['ds'].dt.tz_localize(None)
        
    def objective(self, params):
        """
        Objective function for hyperparameter optimization.
        """
        # Create Prophet model with current parameters
        model = Prophet(
            changepoint_prior_scale=params['changepoint_prior_scale'],
            seasonality_prior_scale=params['seasonality_prior_scale'],
            holidays_prior_scale=params['holidays_prior_scale'],
            seasonality_mode=params['seasonality_mode']
        )
        
        # Fit the model
        model.fit(self.df)
        
        # Make predictions (validation set logic can be improved here, but sticking to your structure)
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        
        # Calculate RMSE on the last 30 days of known data
        y_true = self.df['y'].values[-30:]
        y_pred = forecast['yhat'].values[-30:] # Taking the last 30 predictions that match training data
        
        # Basic error handling for shape mismatch
        if len(y_true) != len(y_pred):
             # Fallback if shapes don't align (e.g. less than 30 days data)
            min_len = min(len(y_true), len(y_pred))
            y_true = y_true[:min_len]
            y_pred = y_pred[:min_len]

        rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
        
        return {'loss': rmse, 'status': STATUS_OK}
        
    def optimize_hyperparameters(self, max_evals=10): # Reduced default for faster web response
        """
        Optimize hyperparameters using hyperopt.
        """
        if self.df is None:
             self.prepare_data()

        # Define the search space
        space = {
            'changepoint_prior_scale': hp.loguniform('changepoint_prior_scale', -5, 0),
            'seasonality_prior_scale': hp.loguniform('seasonality_prior_scale', -5, 0),
            'holidays_prior_scale': hp.loguniform('holidays_prior_scale', -5, 0),
            'seasonality_mode': hp.choice('seasonality_mode', ['additive', 'multiplicative'])
        }
        
        # Run optimization
        trials = Trials()
        best = fmin(
            fn=self.objective,
            space=space,
            algo=tpe.suggest,
            max_evals=max_evals,
            trials=trials,
            show_progressbar=False
        )
        
        # Get the best parameters
        self.best_params = {
            'changepoint_prior_scale': best['changepoint_prior_scale'],
            'seasonality_prior_scale': best['seasonality_prior_scale'],
            'holidays_prior_scale': best['holidays_prior_scale'],
            'seasonality_mode': ['additive', 'multiplicative'][best['seasonality_mode']]
        }
        
    def train_best_model(self):
        """
        Train the Prophet model with the best hyperparameters.
        """
        if self.best_params is None:
            raise ValueError("No optimized parameters available. Please run optimize_hyperparameters first.")
            
        # Create Prophet model with best parameters
        self.model = Prophet(
            changepoint_prior_scale=self.best_params['changepoint_prior_scale'],
            seasonality_prior_scale=self.best_params['seasonality_prior_scale'],
            holidays_prior_scale=self.best_params['holidays_prior_scale'],
            seasonality_mode=self.best_params['seasonality_mode']
        )
        
        # Fit the model
        self.model.fit(self.df)
        
    def forecast_next_year(self):
        """
        Forecast stock prices for the next year.
        """
        if self.model is None:
            raise ValueError("No trained model available. Please train the model first.")
            
        # Create future dataframe for next year
        future = self.model.make_future_dataframe(periods=365)
        
        # Make predictions
        self.forecast = self.model.predict(future)
        
    def visualize_forecast(self, save_path=None):
        """
        Visualize the forecast.
        - If save_path: saves file to disk.
        - If NO save_path: returns Base64 string for web display.
        """
        if self.forecast is None:
            return None
            
        try:
            plt.style.use('seaborn-v0_8')
            
            # Create plot
            fig = plt.figure(figsize=(12, 6))
            
            # Plot historical data
            plt.plot(self.df['ds'], self.df['y'], 
                    label='Historical', color='blue', linewidth=2)
            
            # Plot forecast
            plt.plot(self.forecast['ds'], self.forecast['yhat'], 
                    label='Forecast', color='red', linestyle='--', linewidth=2)
            
            # Add confidence intervals
            plt.fill_between(self.forecast['ds'], 
                           self.forecast['yhat_lower'], 
                           self.forecast['yhat_upper'],
                           color='gray', alpha=0.2, label='Confidence Interval')
            
            plt.title(f'{self.stock_data.ticker} Stock Price Forecast (Optimized)')
            plt.xlabel('Date')
            plt.ylabel('Price')
            plt.legend()
            plt.grid(True)
            plt.xticks(rotation=45)
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
            
    def run_analysis(self, max_evals=10):
        """
        Run complete pipeline.
        Reduced max_evals default to 10 for faster web response.
        """
        self.prepare_data()
        self.optimize_hyperparameters(max_evals)
        self.train_best_model()
        self.forecast_next_year()
        
        return self.best_params

# Example usage
if __name__ == "__main__":
    # Create StockData object
    try:
        stock_data = StockData(
            ticker="GOOG",
            start_date="2023-01-01",
            end_date="2025-12-31"
        )
        stock_data.fetch_closing_prices()
        
        # Run optimization
        model = StockHyperopt(stock_data)
        best_params = model.run_analysis(max_evals=5) # Small eval for test
        
        print("\nBest Hyperparameters:", best_params)
        
        # Test visualization
        model.visualize_forecast("hyperopt_test.png")
        print("Test complete.")
        
    except Exception as e:
        print(f"Test failed: {e}")