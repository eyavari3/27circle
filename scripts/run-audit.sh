#!/bin/bash

# Database Audit Runner for 27 Circle
# This script runs a comprehensive READ-ONLY audit of the database

echo "🔍 Starting 27 Circle Database Audit..."
echo "⚠️  This is a READ-ONLY audit - no changes will be made"
echo ""

# Check if we have the required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: No database URL found"
    echo "Please set either DATABASE_URL or SUPABASE_DB_URL environment variable"
    echo ""
    echo "For local development, you can get the URL from:"
    echo "1. Supabase Dashboard > Settings > Database"
    echo "2. Or check your .env.local file"
    echo ""
    exit 1
fi

# Use whichever database URL is available
DB_URL=${DATABASE_URL:-$SUPABASE_DB_URL}

# Create output directory
mkdir -p ./scripts/audit-results

# Generate timestamped filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="./scripts/audit-results/database-audit-${TIMESTAMP}.txt"

echo "📊 Running audit and saving results to: $OUTPUT_FILE"
echo ""

# Run the audit and save results
if psql "$DB_URL" -f ./scripts/database-audit.sql > "$OUTPUT_FILE" 2>&1; then
    echo "✅ Audit completed successfully!"
    echo ""
    echo "📁 Results saved to: $OUTPUT_FILE"
    echo ""
    echo "🔍 Quick summary:"
    echo "=================="
    
    # Show a quick summary from the results
    echo "Tables found:"
    grep -A 20 "TABLE INVENTORY" "$OUTPUT_FILE" | tail -n +3 | head -n 15
    
    echo ""
    echo "📖 View full results with:"
    echo "   cat $OUTPUT_FILE"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Review empty tables marked as 'EMPTY'"
    echo "   2. Check unused indexes marked as 'UNUSED'"
    echo "   3. Verify critical data completeness"
    echo "   4. Identify duplicate functionality"
    
else
    echo "❌ Audit failed. Check the output file for errors:"
    echo "   cat $OUTPUT_FILE"
    exit 1
fi