# prediction.py
# ─────────────────────────────────────────────
# Shreyasvi's file — Prediction Model
# CommunityPulse Smart Resource Allocation
# ─────────────────────────────────────────────
#
# What this file does:
#   Looks at past Need Cards (historical data)
#   Finds patterns (food needs spike on Mondays in Ward 3)
#   Predicts FUTURE needs before they happen
#   Sends early warnings so NGOs prepare in advance
#
# Uses Facebook Prophet — a powerful time series model

import pandas as pd
from datetime import datetime, timedelta


# ─────────────────────────────────────────────────────────────────────────────
# SAMPLE DATA — In real use this comes from the database
# ─────────────────────────────────────────────────────────────────────────────
def generate_sample_data():
    """
    Creates sample historical need data for testing.
    In real deployment this comes from Pulkit's database.

    Returns a pandas DataFrame with columns:
      date, need_type, location, quantity
    """
    import random

    data = []
    base_date = datetime.now() - timedelta(days=90)  # last 90 days

    for day in range(90):
        current_date = base_date + timedelta(days=day)
        day_of_week  = current_date.weekday()  # 0=Monday, 6=Sunday

        # Food needs — spike on Mondays and Fridays
        food_base = 15
        if day_of_week in [0, 4]:   # Monday and Friday
            food_base = 35
        data.append({
            "date"     : current_date.strftime("%Y-%m-%d"),
            "need_type": "food",
            "location" : "Ward 3",
            "quantity" : food_base + random.randint(-5, 10)
        })

        # Medical needs — spike at end of month
        if day % 30 >= 25:  # last 5 days of each month
            data.append({
                "date"     : current_date.strftime("%Y-%m-%d"),
                "need_type": "medical",
                "location" : "Block C",
                "quantity" : random.randint(3, 8)
            })

        # Water needs — consistent
        data.append({
            "date"     : current_date.strftime("%Y-%m-%d"),
            "need_type": "water",
            "location" : "Zone 4",
            "quantity" : random.randint(20, 50)
        })

    return pd.DataFrame(data)


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 1 — Prepare Data for Prophet
# ─────────────────────────────────────────────────────────────────────────────
def prepare_prophet_data(df, need_type, location=None):
    """
    Filters and shapes the data for Prophet.

    Prophet needs exactly 2 columns:
      ds = date (datetime format)
      y  = value to predict (quantity)

    Input:  full DataFrame, need type to filter on
    Output: filtered DataFrame with ds and y columns
    """
    # Filter by need type
    filtered = df[df["need_type"] == need_type].copy()

    # Filter by location if specified
    if location:
        filtered = filtered[filtered["location"] == location]

    if filtered.empty:
        return None

    # Group by date and sum quantities
    daily = filtered.groupby("date")["quantity"].sum().reset_index()

    # Rename for Prophet
    daily.columns = ["ds", "y"]
    daily["ds"]   = pd.to_datetime(daily["ds"])

    return daily


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 2 — Predict Future Needs
# ─────────────────────────────────────────────────────────────────────────────
def predict_future_needs(df, need_type, location=None, days_ahead=7):
    """
    Uses Facebook Prophet to predict needs for the next N days.

    How it works:
      Takes past data (90 days of Need Cards)
      Prophet finds weekly and monthly patterns
      Predicts what will happen in the next 7 days

    Input:  historical DataFrame, need type, how many days ahead
    Output: list of predictions with dates and expected quantities
    """
    try:
        from prophet import Prophet
    except ImportError:
        print("Prophet not installed. Run: pip install prophet")
        return []

    # Prepare the data
    prophet_data = prepare_prophet_data(df, need_type, location)

    if prophet_data is None or len(prophet_data) < 10:
        return []

    # Create and train Prophet model
    model = Prophet(
        yearly_seasonality  = False,   # not enough data for yearly
        weekly_seasonality  = True,    # yes — weekly patterns exist
        daily_seasonality   = False,   # not needed
        changepoint_prior_scale = 0.1  # how flexible the trend is
    )

    # Silence Prophet's output (it's verbose by default)
    import logging
    logging.getLogger("prophet").setLevel(logging.WARNING)
    logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

    model.fit(prophet_data)

    # Create future dates to predict
    future = model.make_future_dataframe(periods=days_ahead)

    # Make predictions
    forecast = model.predict(future)

    # Extract only future predictions (not past)
    today = pd.Timestamp(datetime.now().date())
    future_forecast = forecast[forecast["ds"] >= today].tail(days_ahead)

    # Format results
    predictions = []
    for _, row in future_forecast.iterrows():
        predicted_qty = max(0, int(row["yhat"]))          # predicted value
        lower_bound   = max(0, int(row["yhat_lower"]))    # minimum likely
        upper_bound   = max(0, int(row["yhat_upper"]))    # maximum likely

        predictions.append({
            "date"         : row["ds"].strftime("%Y-%m-%d"),
            "need_type"    : need_type,
            "location"     : location or "all",
            "predicted_qty": predicted_qty,
            "lower_bound"  : lower_bound,
            "upper_bound"  : upper_bound,
            "confidence"   : "high" if (upper_bound - lower_bound) < 20 else "medium"
        })

    return predictions


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 3 — Detect Danger Zones (hotspots)
# ─────────────────────────────────────────────────────────────────────────────
def detect_crisis_zones(df, threshold_multiplier=1.5):
    """
    Finds locations where needs are MUCH higher than normal.

    How it works:
      Calculates average needs per location
      Flags any location that is 1.5x above average
      Returns a list of danger zones with severity

    Input:  historical DataFrame
    Output: list of crisis zones with severity labels
    """
    crisis_zones = []

    # Group by location and need type
    location_stats = df.groupby(["location", "need_type"])["quantity"].agg(
        ["mean", "max", "count"]
    ).reset_index()

    # Calculate overall average
    overall_mean = df["quantity"].mean()

    for _, row in location_stats.iterrows():
        location_mean = row["mean"]

        # Is this location's average much higher than overall?
        if location_mean > overall_mean * threshold_multiplier:
            severity = "high"
            if location_mean > overall_mean * 2:
                severity = "critical"

            crisis_zones.append({
                "location"   : row["location"],
                "need_type"  : row["need_type"],
                "avg_qty"    : round(location_mean, 1),
                "max_qty"    : int(row["max"]),
                "data_points": int(row["count"]),
                "severity"   : severity
            })

    # Sort by severity and quantity
    crisis_zones.sort(key=lambda x: x["avg_qty"], reverse=True)
    return crisis_zones


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 4 — Generate Full Prediction Report
# ─────────────────────────────────────────────────────────────────────────────
def generate_prediction_report(df=None):
    """
    Master function — generates a complete prediction report.

    Runs predictions for all major need types.
    Identifies crisis zones.
    Returns everything in one structured dictionary.

    This is what gets shown on the Admin Dashboard.
    """
    if df is None:
        df = generate_sample_data()

    report = {
        "generated_at"  : datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "predictions"   : {},
        "crisis_zones"  : [],
        "summary"       : {}
    }

    # Predict for each need type
    need_types = ["food", "medical", "water", "education"]

    for need_type in need_types:
        preds = predict_future_needs(df, need_type, days_ahead=7)
        if preds:
            report["predictions"][need_type] = preds

            # Find peak day
            peak = max(preds, key=lambda x: x["predicted_qty"])
            report["summary"][need_type] = {
                "next_7_days_total": sum(p["predicted_qty"] for p in preds),
                "peak_day"         : peak["date"],
                "peak_quantity"    : peak["predicted_qty"]
            }

    # Find crisis zones
    report["crisis_zones"] = detect_crisis_zones(df)

    return report


# ─────────────────────────────────────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    print("\n" + "=" * 55)
    print("   CommunityPulse — Prediction Module Test")
    print("=" * 55)

    # Generate sample historical data
    print("\n[1] Generating 90 days of sample data...")
    df = generate_sample_data()
    print(f"    Generated {len(df)} data points")
    print(f"    Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"    Need types: {df['need_type'].unique().tolist()}")

    # Predict food needs
    print("\n[2] Predicting food needs for next 7 days...")
    food_predictions = predict_future_needs(df, "food", "Ward 3", days_ahead=7)

    if food_predictions:
        print("\n    Date         | Predicted | Range")
        print("    " + "-" * 40)
        for p in food_predictions:
            print(f"    {p['date']} | {p['predicted_qty']:>9} | {p['lower_bound']}–{p['upper_bound']}")
    else:
        print("    No predictions generated (need more data)")

    # Find crisis zones
    print("\n[3] Detecting crisis zones...")
    zones = detect_crisis_zones(df)
    if zones:
        for zone in zones[:3]:
            print(f"    {zone['location']} — {zone['need_type']} — avg: {zone['avg_qty']} — {zone['severity'].upper()}")
    else:
        print("    No crisis zones detected")

    print("\n" + "=" * 55)
    print("  Prediction module ready!")
    print("=" * 55)