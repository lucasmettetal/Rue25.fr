-- Galerie produit : jusqu'à 5 visuels et une vidéo par pièce.
--
-- `images` devient la source de vérité ; `image_url` est conservée et tenue à
-- jour sur images[0] par l'API. Elle reste lue par le panier (stocké côté
-- navigateur), les cartes du catalogue et l'aperçu de partage : la supprimer
-- casserait ces chemins pendant la fenêtre entre le déploiement de l'API et
-- celui du front, qui sont indépendants.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "video_url" TEXT;

-- Reprise des visuels existants : l'image unique devient le premier élément.
UPDATE "products"
   SET "images" = ARRAY["image_url"]
 WHERE "image_url" IS NOT NULL
   AND cardinality("images") = 0;
