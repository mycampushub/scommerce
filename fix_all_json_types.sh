#!/bin/bash
# Fix all response.json() and similar patterns missing type annotations

# Fix "const result = await response.json()" without type
grep -rl "const result = await response\.json()" src/ --include="*.tsx" --include="*.ts" | while read file; do
  if ! grep -q "as {" "$file" 2>/dev/null; then
    sed -i 's/const result = await response\.json()/const result = await response.json() as { success?: boolean; error?: string; data?: any }/' "$file"
    echo "Fixed: $file"
  fi
done

# Fix "const data = await response.json()" without type
grep -rl "const data = await.*\.json()" src/ --include="*.tsx" --include="*.ts" | while read file; do
  if ! grep -q "as {" "$file" 2>/dev/null; then
    sed -i 's/const data = await \(.*\)\.json()/const data = await \1.json() as { success?: boolean; error?: string; data?: any }/' "$file"
    echo "Fixed data: $file"
  fi
done

echo "All done!"
