// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@1'
// import { Webhook } from 'https://esm.sh/svix@1.61.0'
// import { getSupabaseClient } from '@/lib/supabase'

// const supabaseUrl = Deno.env.get('SUPABASE_URL')
// const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
// const clerkWebhookSecret = Deno.env.get('CLERK_WEBHOOK_SECRET')

// // Validate environment variables
// if (!supabaseUrl || !supabaseServiceKey || !clerkWebhookSecret) {
//   throw new Error(
//     `Missing required environment variables: ${
//       !supabaseUrl ? 'SUPABASE_URL ' : ''
//     }${!supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY ' : ''}${
//       !clerkWebhookSecret ? 'CLERK_WEBHOOK_SECRET' : ''
//     }`
//   )
// }

// const supabase = createClient(supabaseUrl, supabaseServiceKey)

// serve(async (req) => {
//   // Only allow POST requests
//   if (req.method !== 'POST') {
//     return new Response('Method not allowed', { status: 405 })
//   }

//   // Get the headers
//   const svixId = req.headers.get('svix-id')
//   const svixTimestamp = req.headers.get('svix-timestamp')
//   const svixSignature = req.headers.get('svix-signature')

//   // If there are no headers, error out
//   if (!svixId || !svixTimestamp || !svixSignature) {
//     return new Response('Error occurred -- no svix headers', { status: 400 })
//   }

//   // Get the body
//   const payload = await req.json()
//   const body = JSON.stringify(payload)

//   // Create a new Svix instance with your secret
//   const wh = new Webhook(clerkWebhookSecret)

//   let evt: any

//   // Verify the payload with the headers
//   try {
//     evt = wh.verify(body, {
//       'svix-id': svixId,
//       'svix-timestamp': svixTimestamp,
//       'svix-signature': svixSignature,
//     })
//   } catch (err) {
//     console.error('Error verifying webhook:', err)
//     return new Response('Error occurred', { status: 400 })
//   }

//   // Handle the webhook
//   const eventType = evt.type

//   try {
//     switch (eventType) {
//       case 'user.created': {
//         const { id, email_addresses, first_name, last_name, primary_email_address_id } = evt.data
//         const primaryEmail = email_addresses.find(
//           (email: any) => email.id === primary_email_address_id
//         )?.email_address

//         if (!primaryEmail) {
//           return new Response('No primary email found', { status: 400 })
//         }

//         const { error } = await supabase.from('users').insert({
//           id,
//           email: primaryEmail,
//           full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
//         })

//         if (error) throw error
//         break
//       }

//       case 'user.updated': {
//         const { id, email_addresses, first_name, last_name, primary_email_address_id } = evt.data
//         const primaryEmail = email_addresses.find(
//           (email: any) => email.id === primary_email_address_id
//         )?.email_address

//         if (!primaryEmail) {
//           return new Response('No primary email found', { status: 400 })
//         }

//         const { error } = await supabase
//           .from('users')
//           .update({
//             email: primaryEmail,
//             full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
//           })
//           .eq('id', id)

//         if (error) throw error
//         break
//       }

//       case 'user.deleted': {
//         const { id } = evt.data

//         const { error } = await supabase.from('users').delete().eq('id', id)

//         if (error) throw error
//         break
//       }
//     }

//     return new Response('Webhook processed successfully', { status: 200 })
//   } catch (error) {
//     console.error('Error processing webhook:', error)
//     return new Response('Error processing webhook', { status: 500 })
//   }
// })

// (async () => {
//   const supabase = await getSupabaseClient()

//   // Example usage of the supabase client
//   const { data, error } = await supabase.from('users').select('*')
//   if (error) {
//     console.error('Error fetching users:', error)
//   } else {
//     console.log('Users:', data)
//   }
// })() 