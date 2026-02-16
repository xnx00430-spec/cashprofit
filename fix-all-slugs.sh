#!/bin/bash

echo "🔍 Recherche des conflits de slugs dynamiques..."
echo ""

# Fonction pour renommer récursivement
rename_slugs() {
    local base_path="$1"
    local old_slug="$2"
    local new_slug="$3"
    
    echo "📂 Traitement de: $base_path"
    
    # Renommer les dossiers [id] en [userId] ou autre
    find "$base_path" -type d -name "[$old_slug]" 2>/dev/null | while read folder; do
        new_folder="${folder%/[$old_slug]}/[$new_slug]"
        if [ -d "$folder" ]; then
            echo "  ✓ Renommage: $folder → $new_folder"
            mv "$folder" "$new_folder" 2>/dev/null || echo "  ⚠️  Déjà renommé ou erreur"
        fi
    done
    
    # Corriger les références dans les fichiers
    find "$base_path" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \) | while read file; do
        if grep -q "params\.$old_slug\|params?\.$old_slug" "$file" 2>/dev/null; then
            echo "  📝 Correction: $file"
            
            # Mac compatible (BSD sed)
            sed -i '' "s/params\.$old_slug/params.$new_slug/g" "$file"
            sed -i '' "s/params?\.$old_slug/params?.$new_slug/g" "$file"
            sed -i '' "s/{ $old_slug }/{ $new_slug }/g" "$file"
            sed -i '' "s/const $old_slug = params/const $new_slug = params/g" "$file"
        fi
    done
}

echo "🔧 Corrections des routes API..."
echo ""

# 1. Admin users: [id] → [userId]
if [ -d "app/api/admin/users" ]; then
    rename_slugs "app/api/admin/users" "id" "userId"
fi

# 2. Admin withdrawals: si [id] existe, le renommer en [withdrawalId]
if [ -d "app/api/admin/withdrawals" ]; then
    rename_slugs "app/api/admin/withdrawals" "id" "withdrawalId"
fi

# 3. Admin opportunities: [id] → [opportunityId]
if [ -d "app/api/admin/opportunities" ]; then
    rename_slugs "app/api/admin/opportunities" "id" "opportunityId"
fi

# 4. Admin investments: [id] → [investmentId]
if [ -d "app/api/admin/investments" ]; then
    rename_slugs "app/api/admin/investments" "id" "investmentId"
fi

# 5. User routes: vérifier aussi
if [ -d "app/api/user" ]; then
    # Renommer [id] en contexte user
    find app/api/user -type d -name "[id]" | while read folder; do
        parent=$(dirname "$folder")
        parent_name=$(basename "$parent")
        
        case "$parent_name" in
            "investments")
                new_name="[investmentId]"
                ;;
            "opportunities")
                new_name="[opportunityId]"
                ;;
            *)
                new_name="[itemId]"
                ;;
        esac
        
        new_folder="$parent/$new_name"
        echo "  ✓ Renommage user: $folder → $new_folder"
        mv "$folder" "$new_folder" 2>/dev/null || echo "  ⚠️  Déjà fait"
    done
fi

echo ""
echo "✅ CORRECTION TERMINÉE !"
echo ""
echo "📋 Résumé:"
echo "  - app/api/admin/users/[userId]/"
echo "  - app/api/admin/withdrawals/[withdrawalId]/"
echo "  - app/api/admin/opportunities/[opportunityId]/"
echo "  - app/api/admin/investments/[investmentId]/"
echo ""
echo "🚀 Redémarre le serveur: npm run dev"