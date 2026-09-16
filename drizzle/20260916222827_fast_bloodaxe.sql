CREATE TYPE "wraith"."candy_tier" AS ENUM('COMMON', 'RARE', 'EPIC');--> statement-breakpoint
CREATE TYPE "wraith"."team_type" AS ENUM('HUNTERS', 'GHOSTS');--> statement-breakpoint
CREATE TABLE "wraith"."balances" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tier" "wraith"."candy_tier" NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wraith"."cauldron_contributions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team" "wraith"."team_type" NOT NULL,
	"candies_contributed" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wraith"."daily_metrics" (
	"date_key" text PRIMARY KEY NOT NULL,
	"messages_read" bigint DEFAULT 0 NOT NULL,
	"commands_executed" integer DEFAULT 0 NOT NULL,
	"candies_dropped" integer DEFAULT 0 NOT NULL,
	"curses_applied" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wraith"."guild_configs" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"ban_engagement_role_id" text,
	"hunter_role_id" text,
	"ghost_role_id" text,
	"admin_role_id" text,
	"drop_channel_ids" text[],
	"command_channel_ids" text[],
	"peak_start_hour" integer DEFAULT 17 NOT NULL,
	"peak_end_hour" integer DEFAULT 2 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wraith"."ledger_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tier" "wraith"."candy_tier" NOT NULL,
	"amount" integer NOT NULL,
	"operation_type" text NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wraith"."players" (
	"user_id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"team" "wraith"."team_type" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"curse_cooldown_until" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wraith"."balances" ADD CONSTRAINT "balances_user_id_players_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "wraith"."players"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wraith"."cauldron_contributions" ADD CONSTRAINT "cauldron_contributions_user_id_players_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "wraith"."players"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_tier_idx" ON "wraith"."balances" USING btree ("user_id","tier");