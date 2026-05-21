use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::collections::HashMap;
use tower_http::cors::{Any, CorsLayer};

#[derive(serde::Serialize, sqlx::FromRow)]
struct WubiRecord {
    char: String,
    code: String,
    pinyin: Option<String>,
    strokes: Option<i32>,
    units: Option<String>,
    segments: serde_json::Value,
}

#[derive(serde::Deserialize)]
struct SeedChar {
    char: String,
    code: String,
    pinyin: Option<String>,
    strokes: Option<i32>,
    units: Option<String>,
    segments: serde_json::Value,
}

#[derive(serde::Serialize, sqlx::FromRow)]
struct PracticeRecord {
    id: i32,
    timestamp: chrono::DateTime<chrono::Utc>,
    mode: String,
    wpm: i32,
    accuracy: i32,
    wrong_count: i32,
    duration: i32,
}

#[derive(serde::Deserialize)]
struct CreateRecordPayload {
    mode: String,
    wpm: i32,
    accuracy: i32,
    wrong_count: i32,
    duration: i32,
}

#[derive(serde::Deserialize)]
struct UpdateWeaknessPayload {
    zone: String,
    count: Option<i32>,
}

#[derive(serde::Serialize, sqlx::FromRow)]
struct WeaknessRow {
    zone: String,
    error_count: i32,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/wubimaster".to_string());

    println!("Connecting to database: {}", database_url);

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to Postgres pool");

    setup_db(&pool).await;

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/wubi/{char}", get(get_wubi))
        .route("/api/records", get(get_records).post(create_record).delete(clear_records))
        .route("/api/weakness", get(get_weakness).post(update_weakness))
        .layer(cors)
        .with_state(pool);

    let port = std::env::var("PORT").unwrap_or_else(|_| "5000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    println!("Rust server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn setup_db(pool: &PgPool) {
    println!("Running database migrations...");
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS wubi_decompositions (
            char VARCHAR(10) PRIMARY KEY,
            code VARCHAR(10),
            pinyin VARCHAR(50),
            strokes INTEGER,
            units VARCHAR(100),
            segments JSONB
        );"
    )
    .execute(pool)
    .await
    .unwrap();

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS practice_records (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            mode VARCHAR(50),
            wpm INTEGER,
            accuracy INTEGER,
            wrong_count INTEGER,
            duration INTEGER
        );"
    )
    .execute(pool)
    .await
    .unwrap();

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS weakness_stats (
            zone VARCHAR(10) PRIMARY KEY,
            error_count INTEGER DEFAULT 0
        );"
    )
    .execute(pool)
    .await
    .unwrap();

    // Check if seeding is needed
    let row_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM wubi_decompositions")
        .fetch_one(pool)
        .await
        .unwrap();

    if row_count.0 == 0 {
        println!("Seeding database from wubi_seed_data.json...");
        
        let paths = ["wubi_seed_data.json", "server/wubi_seed_data.json"];
        let mut file_content = None;
        for path in &paths {
            if let Ok(content) = std::fs::read_to_string(path) {
                file_content = Some(content);
                break;
            }
        }

        if let Some(content) = file_content {
            if let Ok(items) = serde_json::from_str::<Vec<SeedChar>>(&content) {
                println!("Found {} characters to seed.", items.len());
                let mut tx = pool.begin().await.unwrap();
                for item in items {
                    let _ = sqlx::query(
                        "INSERT INTO wubi_decompositions (char, code, pinyin, strokes, units, segments)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (char) DO NOTHING"
                    )
                    .bind(&item.char)
                    .bind(&item.code)
                    .bind(&item.pinyin)
                    .bind(&item.strokes)
                    .bind(&item.units)
                    .bind(&item.segments)
                    .execute(&mut *tx)
                    .await;
                }
                tx.commit().await.unwrap();
                println!("Database seeding completed successfully.");
            } else {
                println!("Failed to parse wubi_seed_data.json.");
            }
        } else {
            println!("wubi_seed_data.json not found. Seeding skipped.");
        }
    } else {
        println!("Database already seeded. {} rows found.", row_count.0);
    }
}

async fn get_wubi(
    Path(character): Path<String>,
    State(pool): State<PgPool>,
) -> Result<Json<WubiRecord>, StatusCode> {
    let result = sqlx::query_as::<_, WubiRecord>(
        "SELECT char, code, pinyin, strokes, units, segments FROM wubi_decompositions WHERE char = $1"
    )
    .bind(&character)
    .fetch_optional(&pool)
    .await;

    match result {
        Ok(Some(record)) => Ok(Json(record)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_records(
    State(pool): State<PgPool>,
) -> Result<Json<Vec<PracticeRecord>>, StatusCode> {
    let result = sqlx::query_as::<_, PracticeRecord>(
        "SELECT id, timestamp, mode, wpm, accuracy, wrong_count, duration FROM practice_records ORDER BY timestamp DESC LIMIT 500"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(records) => Ok(Json(records)),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn create_record(
    State(pool): State<PgPool>,
    Json(payload): Json<CreateRecordPayload>,
) -> Result<Json<PracticeRecord>, StatusCode> {
    let result = sqlx::query_as::<_, PracticeRecord>(
        "INSERT INTO practice_records (mode, wpm, accuracy, wrong_count, duration)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, timestamp, mode, wpm, accuracy, wrong_count, duration"
    )
    .bind(&payload.mode)
    .bind(&payload.wpm)
    .bind(&payload.accuracy)
    .bind(&payload.wrong_count)
    .bind(&payload.duration)
    .fetch_one(&pool)
    .await;

    match result {
        Ok(record) => Ok(Json(record)),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn clear_records(
    State(pool): State<PgPool>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let result = sqlx::query("DELETE FROM practice_records")
        .execute(&pool)
        .await;

    match result {
        Ok(_) => Ok(Json(serde_json::json!({ "success": true, "message": "All practice records cleared successfully." }))),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_weakness(
    State(pool): State<PgPool>,
) -> Result<Json<HashMap<String, i32>>, StatusCode> {
    let mut stats = HashMap::new();
    for zone in ["1", "2", "3", "4", "5"] {
        stats.insert(zone.to_string(), 0);
    }

    let result = sqlx::query_as::<_, WeaknessRow>(
        "SELECT zone, error_count FROM weakness_stats"
    )
    .fetch_all(&pool)
    .await;

    match result {
        Ok(rows) => {
            for row in rows {
                stats.insert(row.zone, row.error_count);
            }
            Ok(Json(stats))
        }
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn update_weakness(
    State(pool): State<PgPool>,
    Json(payload): Json<UpdateWeaknessPayload>,
) -> Result<Json<WeaknessRow>, StatusCode> {
    let count = payload.count.unwrap_or(1);
    let result = sqlx::query_as::<_, WeaknessRow>(
        "INSERT INTO weakness_stats (zone, error_count)
         VALUES ($1, $2)
         ON CONFLICT (zone)
         DO UPDATE SET error_count = weakness_stats.error_count + EXCLUDED.error_count
         RETURNING zone, error_count"
    )
    .bind(&payload.zone)
    .bind(&count)
    .fetch_one(&pool)
    .await;

    match result {
        Ok(row) => Ok(Json(row)),
        Err(e) => {
            eprintln!("Database error: {:?}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
