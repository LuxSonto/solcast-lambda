import { APIGatewayProxyHandler } from 'aws-lambda';
import { Pool } from 'pg';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: {
        prefer: true,
        rejectUnauthorized: false
    }
};

const API_URL = "https://script.googleusercontent.com/a/macros/solink.co.za/echo?user_content_key=mMFKILKfN4pCpe_K-ymeLawywPBjs738P70RgRcUkk3iWf3cQJDgTcVTT-m8dvWBQzcntX2H1JIhcoxrCpglmQ1NLI4rTLy3OJmA1Yb3SEsKFZqtv3DaNYcMrmhZHmUMi80zadyHLKCwq8y9dFH4mJT3zkIp4-K468n4RAo2RJxBnu0Hupo_TOS8jmg-86IFx3v2oWP-ldoU2gapZ-4-Ov1eLHQAMkT2dtcwQHkATq_P8HS5eahm695_B1e7ssetegtgkpBvh1_1BiB1RU8w4TrCMwGvcl2MsD64VxOIfL0&lib=MR_mt8Wmapn2W5zwbI-xTtMWO3py5UuMP";

export const handler: APIGatewayProxyHandler = async () => {
    const pool = new Pool(DB_CONFIG);

    try {
        const response = await axios.get(API_URL);
        const dataArray = response.data.data;

        if (!Array.isArray(dataArray)) {
            throw new Error('Invalid data received from API: Expected an array.');
        }

        let insertedCount = 0;
        for (const data of dataArray) {
            if (!data || typeof data !== 'object') {
                console.error("Invalid data object within array", data);
                continue;
            }

            const checkQuery = 'SELECT 1 FROM public.solcast_forecasts WHERE period_end = $1';
            const checkResult = await pool.query(checkQuery, [data.period_end]);

            if (checkResult.rows.length > 0) {
                console.log(`period_end ${data.period_end} already exists. Skipping.`);
                continue;
            }

            if (typeof data.pv_power_rooftop === 'number') {
                data.pv_power_rooftop = data.pv_power_rooftop * 1000;
            }

            const query = `
                INSERT INTO public.solcast_forecasts (period_end, air_temp, dni, ghi, relative_humidity, surface_pressure, wind_speed_10m, pv_power_rooftop, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            `;
            await pool.query(query, [
                data.period_end,
                data.air_temp,
                data.dni,
                data.ghi,
                data.relative_humidity,
                data.surface_pressure,
                data.wind_speed_10m,
                data.pv_power_rooftop,
            ]);
            insertedCount++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data stored successfully', insertedCount: insertedCount, totalReceived: dataArray.length }),
            data: dataArray,
        };
    } catch (error) {
        console.error("Error fetching or storing data", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    } finally {
        await pool.end();
    }
};