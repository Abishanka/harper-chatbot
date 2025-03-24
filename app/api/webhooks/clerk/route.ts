import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  // Get the headers
  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    // Get the primary email address
    const primaryEmail = email_addresses.find(email => email.id === evt.data.primary_email_address_id)?.email_address;

    if (!primaryEmail) {
      return new Response('No primary email found', {
        status: 400
      });
    }

    try {
      // Create user in Supabase
      const { error } = await supabase
        .from('users')
        .insert({
          id,
          email: primaryEmail,
          full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        });

      if (error) {
        console.error('Error creating user in Supabase:', error);
        return new Response('Error creating user in Supabase', {
          status: 500
        });
      }

      return new Response('User created successfully', {
        status: 200
      });
    } catch (error) {
      console.error('Error in webhook handler:', error);
      return new Response('Error processing webhook', {
        status: 500
      });
    }
  }

  return new Response('Webhook received', {
    status: 200
  });
} 