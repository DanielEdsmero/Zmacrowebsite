-- Switch payment provider from Stripe to PayMongo
alter table purchases rename column stripe_session_id to payment_session_id;

-- PHP price in centavos (e.g. 50000 = ₱500.00); falls back to price_usd conversion if null
alter table macros add column if not exists price_php integer;
