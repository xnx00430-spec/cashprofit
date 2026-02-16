#!/bin/bash
# fix-suspense.sh - Ajoute Suspense autour de useSearchParams

FILES=$(grep -rl "useSearchParams" app/ --include="*.jsx" --include="*.js")

for FILE in $FILES; do
  echo "🔧 Fixing: $FILE"
  
  # Vérifier si Suspense est déjà importé
  if grep -q "Suspense" "$FILE"; then
    echo "  ✅ Already has Suspense, skipping"
    continue
  fi

  # Extraire le nom du composant exporté par défaut
  COMPONENT=$(grep -oP 'export default function \K\w+' "$FILE")
  
  if [ -z "$COMPONENT" ]; then
    echo "  ⚠️ No default export found, skipping"
    continue
  fi

  echo "  Component: $COMPONENT"

  # 1. Ajouter Suspense à l'import React ou créer l'import
  if grep -q "from 'react'" "$FILE"; then
    # Ajouter Suspense à l'import existant
    sed -i '' "s/import { /import { Suspense, /" "$FILE"
    # Éviter les doublons
    sed -i '' "s/Suspense, Suspense/Suspense/" "$FILE"
  else
    # Ajouter un nouvel import en haut du fichier après 'use client'
    sed -i '' "/^'use client'/a\\
import { Suspense } from 'react';" "$FILE"
  fi

  # 2. Renommer le composant original en ComponentInner
  sed -i '' "s/export default function ${COMPONENT}/function ${COMPONENT}Inner/" "$FILE"

  # 3. Ajouter le wrapper avec Suspense à la fin du fichier
  cat >> "$FILE" << EOF

export default function ${COMPONENT}() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="text-gray-900">Chargement...</div></div>}>
      <${COMPONENT}Inner />
    </Suspense>
  );
}
EOF

  echo "  ✅ Fixed!"
done

echo ""
echo "🎉 Done! All files fixed."