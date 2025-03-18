BEGIN;

DROP TABLE IF EXISTS public.solcast_forecasts;

CREATE TABLE IF NOT EXISTS public.solcast_forecasts
(
    id serial NOT NULL,
    period_end timestamp with time zone,
    period character varying(20) COLLATE pg_catalog."default",
    air_temp numeric,
    dni numeric,
    ghi numeric,
    relative_humidity numeric,
    surface_pressure numeric,
    wind_speed_10m numeric,
    pv_power_rooftop numeric,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT solcast_forecasts_pkey PRIMARY KEY (id)
);

END;