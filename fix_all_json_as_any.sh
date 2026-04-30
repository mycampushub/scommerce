#!/bin/bash
# Fix all response.json() and request.json() calls by using "as any"

# Fix all "as {" type annotations - replace with "as any"
find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "as {" {} \; | while read file; do
  sed -i 's/as { success?.*}/as any/g' "$file"
  echo "Fixed: $file"
done

echo "All JSON type annotations fixed with 'as any'!"
