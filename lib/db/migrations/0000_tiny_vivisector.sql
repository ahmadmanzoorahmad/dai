CREATE TABLE "dashboards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text,
	"source_file_name" text,
	"raw_content" text,
	"processed_data" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
