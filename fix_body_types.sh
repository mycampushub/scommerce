#!/bin/bash
# Fix all const body = await request.json() to have proper type

grep -rl "const body = await request\.json()" src/ --include="*.ts" --include="*.tsx" | while read file; do
  # Check if the line already has "as any" or ": any"
  if grep -q "const body = await request\.json() as any" "$file" || grep -q "const body: any = await request\.json()" "$file"; then
    echo "Already fixed: $file"
  else
    # Add ": any" to the body variable
    sed -i 's/const body = await request\.json()/const body: any = await request.json()/' "$file"
    echo "Fixed: $file"
  fi
done

echo "All body types fixed!"
