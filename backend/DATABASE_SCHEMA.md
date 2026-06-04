# Database Structure

Extracted at: 5/6/2026, 9:56:31 AM

## Table: audit_logs

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| actor_user_id | int | YES |  |  |  |
| action | varchar(100) | NO |  |  |  |
| entity_type | varchar(50) | NO |  |  |  |
| entity_id | int | NO |  |  |  |
| payload | json | YES |  |  |  |
| ip_address | varchar(45) | YES |  |  |  |
| created_at | datetime | NO |  |  |  |

## Table: booking_slots

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| booking_id | int | NO | MUL |  |  |
| court_id | int | NO | MUL |  |  |
| start_at | datetime | NO |  |  |  |
| end_at | datetime | NO |  |  |  |
| price_cents | int | NO |  |  |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |

## Table: bookings

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| user_id | int | YES | MUL |  |  |
| facility_id | int | NO | MUL |  |  |
| status | enum('pending','confirmed','cancelled','completed','no_show') | YES |  | pending |  |
| payment_status | enum('unpaid','partial','paid','refunded') | YES |  | unpaid |  |
| total_cents | int | YES |  | 0 |  |
| note | text | YES |  |  |  |
| promo_code_id | int | YES |  |  |  |
| checked_in_at | datetime | YES |  |  |  |
| cancelled_at | datetime | YES |  |  |  |
| cancel_reason | varchar(255) | YES |  |  |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |

## Table: cart_items

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| user_id | int | NO | MUL |  |  |
| variant_id | int | NO | MUL |  |  |
| quantity | int | NO |  | 1 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |

## Table: court_types

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| name | enum('badminton','tennis','table_tennis') | NO |  |  |  |
| surface | varchar(50) | YES |  |  |  |
| is_indoor | tinyint(1) | YES |  | 1 |  |
| description | text | YES |  |  |  |
| created_at | datetime | NO |  |  |  |

## Table: courts

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| facility_id | int | NO | MUL |  |  |
| name | varchar(100) | NO |  |  |  |
| court_type | enum('badminton','tennis','football') | NO |  |  |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |

## Table: facilities

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| name | varchar(150) | NO |  |  |  |
| address | varchar(255) | NO |  |  |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |
| avatar_url | varchar(255) | YES |  |  |  |
| cancel_policy | json | YES |  |  |  |
| timezone | varchar(50) | YES |  | Asia/Ho_Chi_Minh |  |
| open_time | time | YES |  | 06:00:00 |  |
| close_time | time | YES |  | 22:00:00 |  |

## Table: inventory_levels

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| variant_id | int | NO | MUL |  |  |
| facility_id | int | NO | MUL |  |  |
| quantity_on_hand | int | YES |  | 0 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |

## Table: inventory_movements

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| variant_id | int | NO | MUL |  |  |
| warehouse_id | int | NO | MUL |  |  |
| qty_delta | int | NO |  |  |  |
| reason | enum('sale','return','adjustment','import') | NO |  |  |  |
| ref_order_id | int | YES |  |  |  |
| note | text | YES |  |  |  |
| created_at | datetime | NO |  |  |  |

## Table: notifications

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| user_id | int | NO | MUL |  |  |
| type | enum('booking_confirmed','booking_reminder','order_status','promotion') | NO |  |  |  |
| title | varchar(255) | NO |  |  |  |
| body | text | NO |  |  |  |
| is_read | tinyint(1) | YES |  | 0 |  |
| ref_type | varchar(50) | YES |  |  |  |
| ref_id | int | YES |  |  |  |
| created_at | datetime | NO |  |  |  |

## Table: order_items

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| order_id | int | NO | MUL |  |  |
| variant_id | int | NO | MUL |  |  |
| quantity | int | NO |  | 1 |  |
| unit_price_cents | int | NO |  |  |  |
| discount_cents | int | YES |  | 0 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |

## Table: orders

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| user_id | int | YES | MUL |  |  |
| facility_id | int | NO | MUL |  |  |
| status | enum('pending_payment','pending_pickup','completed','cancelled','refunded','expired') | NO |  | pending_payment |  |
| subtotal_cents | int | YES |  | 0 |  |
| discount_cents | int | YES |  | 0 |  |
| total_cents | int | YES |  | 0 |  |
| note | text | YES |  |  |  |
| pickup_type | enum('immediate','pickup_store') | NO |  | immediate |  |
| pickup_time | datetime | YES |  |  |  |
| reservation_expires_at | datetime | YES |  |  |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |

## Table: payments

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| provider | enum('cash','vnpay') | NO |  |  |  |
| status | enum('pending','paid','failed','refunded') | YES |  | pending |  |
| amount_cents | int | NO |  |  |  |
| booking_id | int | YES | MUL |  |  |
| order_id | int | YES | MUL |  |  |
| provider_ref | varchar(255) | YES |  |  |  |
| metadata | json | YES |  |  |  |
| paid_at | datetime | YES |  |  |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |

## Table: price_configs

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| facility_id | int | NO | MUL |  |  |
| court_type | varchar(255) | NO |  |  |  |
| start_time | time | NO |  |  |  |
| end_time | time | NO |  |  |  |
| price_per_hour | int | NO |  |  |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |

## Table: product_variants

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| product_id | int | NO | MUL |  |  |
| sku | varchar(100) | NO | UNI |  |  |
| attributes | json | YES |  |  |  |
| price_cents | int | NO |  |  |  |
| barcode | varchar(50) | YES |  |  |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |

## Table: products

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| name | varchar(255) | NO |  |  |  |
| slug | varchar(255) | NO | UNI |  |  |
| category | varchar(100) | NO |  |  |  |
| description | text | YES |  |  |  |
| thumbnail_url | varchar(255) | YES |  |  |  |
| rating | decimal(2,1) | YES |  | 0.0 |  |
| review_count | int | YES |  | 0 |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |

## Table: promo_codes

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| code | varchar(50) | NO | UNI |  |  |
| type | enum('percent','fixed') | NO |  |  |  |
| value | int | NO |  |  |  |
| min_order_cents | int | NO |  | 0 |  |
| max_uses | int | YES |  |  |  |
| used_count | int | YES |  | 0 |  |
| expires_at | datetime | YES |  |  |  |
| active | tinyint(1) | YES |  | 1 |  |
| created_at | datetime | NO |  |  |  |

## Table: refresh_tokens

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| user_id | int | NO | MUL |  |  |
| token_hash | varchar(255) | NO |  |  |  |
| expires_at | datetime | NO |  |  |  |
| revoked | tinyint(1) | YES |  | 0 |  |
| created_at | datetime | NO |  |  |  |

## Table: staff_profiles

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| user_id | int | NO | MUL |  |  |
| facility_id | int | YES | MUL |  |  |
| job_title | varchar(100) | YES |  |  |  |
| active | tinyint(1) | YES |  | 1 |  |
| created_at | datetime | NO |  |  |  |

## Table: users

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| email | varchar(100) | NO | UNI |  |  |
| phone | varchar(20) | YES |  |  |  |
| password_hash | varchar(255) | NO |  |  |  |
| role | enum('admin','staff','customer') | YES |  | customer |  |
| is_active | tinyint(1) | YES |  | 1 |  |
| created_at | datetime | NO |  |  |  |
| updated_at | datetime | NO |  |  |  |
| deleted_at | datetime | YES |  |  |  |
| full_name | varchar(100) | YES |  |  |  |
| avatar_url | varchar(255) | YES |  |  |  |
| loyalty_points | int | YES |  | 0 |  |

## Table: warehouses

| Column | Type | Nullable | Key | Default | Extra |
|--------|------|----------|-----|---------|-------|
| id | int | NO | PRI |  | auto_increment |
| facility_id | int | NO | MUL |  |  |
| name | varchar(150) | NO |  |  |  |
| created_at | datetime | NO |  |  |  |

