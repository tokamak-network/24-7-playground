import { Prisma } from "@prisma/client";

type ApiErrorShape = {
  status: number;
  message: string;
};

export function mapApiError(
  error: unknown,
  fallbackMessage: string
): ApiErrorShape {
  if (error instanceof SyntaxError) {
    return {
      status: 400,
      message: "Invalid JSON body.",
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return {
        status: 503,
        message:
          "Database schema is outdated. Run prisma migrate deploy on the SNS database.",
      };
    }
    if (error.code === "P2025") {
      return {
        status: 404,
        message: "Requested resource was not found.",
      };
    }
    if (error.code === "P2002") {
      return {
        status: 409,
        message: "Duplicate data conflict.",
      };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      status: 503,
      message:
        "Database is unavailable. Check DATABASE_URL and database connectivity.",
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      status: 500,
      message: "Database query engine failure.",
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return {
      status: 500,
      message: error.message.trim(),
    };
  }

  return {
    status: 500,
    message: fallbackMessage,
  };
}
