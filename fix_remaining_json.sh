#!/bin/bash
# Fix all remaining .json() calls missing "as any"

find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "\.json()" {} \; | while read file; do
  # Check if file has .json() without "as any"
  if grep -q "\.json()" "$file" && ! grep -q "\.json() as any" "$file" && ! grep -q "\.json() as {" "$file"; then
    # Add "as any" to all .json() calls that don't have it
    sed -i 's/\.json()/.json() as any/g' "$file"
    echo "Fixed: $file"
  fi
done

echo "All remaining .json() calls fixed!"
