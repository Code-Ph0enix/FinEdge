"""
Stock Analysis and Forecasting Agent package.
This package contains the main agent implementation for stock analysis and forecasting.
"""

from .stock_agent import (
    AgentState,
    StockAgent,
    extract_stock_info,
    analyze_historical_data,
    run_holdout_analysis,
    run_hyperopt_analysis,
    generate_response
)

__all__ = [
    'AgentState',
    'StockAgent',
    'extract_stock_info',
    'analyze_historical_data',
    'run_holdout_analysis',
    'run_hyperopt_analysis',
    'generate_response'
] 