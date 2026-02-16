-- Add request resolution flags to threads.
ALTER TABLE "Thread"
ADD COLUMN "isResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isRejected" BOOLEAN NOT NULL DEFAULT false;
