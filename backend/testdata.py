from database import get_database, Collections

# Get your Clerk User ID (you can find this in browser console when logged in)
CLERK_USER_ID = "user_YOUR_ID_HERE"  # Replace with actual ID

db = get_database()

print("=" * 50)
print("CHECKING YOUR DATA IN MONGODB")
print("=" * 50)

# Check user profile
print("\n1. USER PROFILE:")
profile = db[Collections.USER_PROFILES].find_one({"clerkUserId": CLERK_USER_ID})
if profile:
    print(f"   ✅ Profile found!")
    print(f"   Risk Tolerance: {profile.get('riskTolerance', 'Not set')}")
    print(f"   Onboarding Complete: {profile.get('onboardingCompleted', False)}")
else:
    print("   ❌ No profile found!")

# Check income
print("\n2. INCOME ENTRIES:")
income = list(db[Collections.INCOME].find({"clerkUserId": CLERK_USER_ID}))
if income:
    print(f"   ✅ Found {len(income)} income entries")
    for inc in income:
        print(f"      - {inc.get('source')}: ₹{inc.get('amount')} ({inc.get('frequency')})")
else:
    print("   ❌ No income entries found!")

# Check expenses
print("\n3. EXPENSE ENTRIES:")
expenses = list(db[Collections.EXPENSES].find({"clerkUserId": CLERK_USER_ID}))
if expenses:
    print(f"   ✅ Found {len(expenses)} expense entries")
    for exp in expenses:
        print(f"      - {exp.get('name')}: ₹{exp.get('amount')} ({exp.get('frequency')})")
else:
    print("   ❌ No expense entries found!")

# Check assets
print("\n4. ASSET ENTRIES:")
assets = list(db[Collections.ASSETS].find({"clerkUserId": CLERK_USER_ID}))
if assets:
    print(f"   ✅ Found {len(assets)} asset entries")
    total_assets = sum(a.get('value', 0) for a in assets)
    print(f"   Total Assets: ₹{total_assets:,.0f}")
else:
    print("   ❌ No asset entries found!")

# Check liabilities
print("\n5. LIABILITY ENTRIES:")
liabilities = list(db[Collections.LIABILITIES].find({"clerkUserId": CLERK_USER_ID}))
if liabilities:
    print(f"   ✅ Found {len(liabilities)} liability entries")
    total_liabilities = sum(l.get('amount', 0) for l in liabilities)
    print(f"   Total Liabilities: ₹{total_liabilities:,.0f}")
else:
    print("   ❌ No liability entries found!")

# Check goals
print("\n6. FINANCIAL GOALS:")
goals = list(db[Collections.GOALS].find({"clerkUserId": CLERK_USER_ID}))
if goals:
    print(f"   ✅ Found {len(goals)} goals")
    for goal in goals:
        print(f"      - {goal.get('name')}: ₹{goal.get('targetAmount')}")
else:
    print("   ❌ No goals found!")

print("\n" + "=" * 50)
print("SUMMARY:")
print("=" * 50)
print(f"Profile: {'✅' if profile else '❌'}")
print(f"Income: {len(income) if income else '❌'} entries")
print(f"Expenses: {len(expenses) if expenses else '❌'} entries")
print(f"Assets: {len(assets) if assets else '❌'} entries")
print(f"Liabilities: {len(liabilities) if liabilities else '❌'} entries")
print(f"Goals: {len(goals) if goals else '❌'} entries")
