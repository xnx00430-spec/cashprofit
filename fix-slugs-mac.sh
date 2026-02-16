#!/bin/bash

echo "🔧 Correction des slugs dynamiques..."
echo ""

# Renommer [id] en [userId]
find app/api -type d -name "[id]" | while read folder; do
  new_folder="${folder%/\[id\]}/[userId]"
  echo "📂 Renommage: $folder → $new_folder"
  mv "$folder" "$new_folder"
done

# Corriger les fichiers
find app/api/admin/users -type f \( -name "*.js" -o -name "*.ts" \) | while read file; do
  if grep -q "params.*\.id" "$file"; then
    echo "📄 Correction: $file"
    sed -i '' 's/params\.id/params.userId/g' "$file"
    sed -i '' 's/params?\.id/params?.userId/g' "$file"
    sed -i '' 's/{ id }/{ userId }/g' "$file"
    sed -i '' 's/const id = params/const userId = params/g' "$file"
  fi
done

echo ""
echo "✅ TERMINÉ !"
