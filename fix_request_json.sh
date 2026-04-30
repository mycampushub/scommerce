#!/bin/bash
# Fix all request.json() and response.json() calls missing type annotations

# Fix "const body = await request.json()" without type
grep -rl "const body = await request\.json()" src/ --include="*.ts" --include="*.tsx" | while read file; do
  if ! grep -q "as {" "$file" 2>/dev/null && ! grep -q "as any" "$file" 2>/dev/null; then
    sed -i 's/const body = await request\.json()/const body = await request.json() as any/' "$file"
    echo "Fixed request.json: $file"
  fi
done

# Fix any remaining "const result = await response.json()" without type
grep -rl "const result = await response\.json()" src/ --include="*.ts" --include="*.tsx" | while read file; do
  if ! grep -q "as {" "$file" 2>/dev/null; then
    sed -i 's/const result = await response\.json()/const result = await response.json() as { success?: boolean; error?: string; data?: any }/' "$file"
    echo "Fixed response.json: $file"
  fi
done

# Fix any remaining "const data = await *.json()" without type
grep -rl "const data = await.*\.json()" src/ --include="*.ts" --include="*.tsx" | while read file; do
  if ! grep -q "as {" "$file" 2>/dev/null; then
    sed -i 's/const data = await \(.*\)\.json()/const data = await \1.json() as { success?: boolean; error?: string; data?: any }/' "$file"
    echo "Fixed data.json: $file"
  fi
done

echo "All done!"
