import { json, LoaderArgs } from '@remix-run/server-runtime';

export async function loader({ request, context: { auth } }: LoaderArgs) {
  return json(await auth.getSession(request))
}

export default function Index() {
  return null;
}
