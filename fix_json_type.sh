#!/bin/bash
# Fix TypeScript errors by adding type annotations to response.json() calls

files=$(grep -rl "const result = await response.json()" src/ --include="*.tsx" --include="*.ts" | xargs grep -L "as {")

for file in $files; do
  echo "Fixing: $file"
  # Add type annotation to const result = await response.json()
  sed -i 's/const result = await response\.json()$/const result = await response.json() as { success?: boolean; error?: string; data?: any }/' "$file"
done

echo "Done! Fixed all files."
