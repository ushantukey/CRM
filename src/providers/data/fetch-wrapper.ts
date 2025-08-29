import { GraphQLFormattedError } from "graphql";

type CustomError = {
  message: string;
  statusCode: string;
};

const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem("access_token");

  const headers = (options.headers as Record<string, string>) || {};

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: headers?.Authorization || `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
  });
};

const getGraphQLErrors = (
  body: Record<"errors", GraphQLFormattedError[] | undefined>
): CustomError | null => {
  if (!body) {
    return {
      message: "Unknown error",
      statusCode: "INTERNAL_SERVER_ERROR",
    };
  }

  if ("errors" in body && body.errors) {
    const errors = body.errors;

    const messages = errors.map((error) => error?.message).join(" ");
    const code =
      (errors[0]?.extensions?.code as string | undefined) ||
      "INTERNAL_SERVER_ERROR";

    return {
      message: messages || JSON.stringify(errors),
      statusCode: code,
    };
  }
  return null;
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);

  const responseClone = response.clone();
  const body = await responseClone.json();

  const error = getGraphQLErrors(body);

  if (error) {
    throw error;
  }

  return response;
};
