import type {
  ActionFunction,
  ActionFunctionArgs,
  LoaderFunction,
  LoaderFunctionArgs,
} from '@remix-run/node';
import { Params } from '@remix-run/react';
import { User } from './types';

export class Context {
  request: Request;
  params: Params;
  user: User;

  constructor(args: ActionFunctionArgs | LoaderFunctionArgs) {
    this.request = args.request;
    this.params = args.params;
    this.user = {
      id: '123',
      email: 'jdoe@hhmi.org',
      profile: {
        firstName: 'John',
        middlename: undefined,
        lastName: 'Doe',
      },
    };
  }
}

export function withContext(fn: (ctx: Context) => ReturnType<ActionFunction | LoaderFunction>) {
  return async (args: ActionFunctionArgs | LoaderFunctionArgs) => {
    return await fn(new Context(args));
  };
}
