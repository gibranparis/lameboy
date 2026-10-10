-- add_product_image_columns.sql
-- Migration for a database already created from an earlier schema.sql
-- (schema.sql itself now creates these columns on a fresh install, so this
-- file is only needed to bring an existing products table up to date).
--
-- Adds per-product image URLs so a product row is self-contained instead of
-- depending on a hardcoded slug -> local-file lookup in
-- src/app/api/products/route.js — that lookup only covered the five
-- original static-catalog slugs, so any other product came back with no
-- image at all. Run this once against your Supabase project, then set
-- image_url / thumb_url on existing rows (a local /products/*.webp path
-- works fine, or a hosted URL).

alter table products
  add column if not exists image_url text,
  add column if not exists thumb_url text;
