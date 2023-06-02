export default ({ action }, { env, services }) => {
	const { MailService, ItemService } = services;
  action('items.create', async ({ key, collection, payload }, { schema }) => {
    if (collection !== 'customers') return;
    const stripe = require(stripe)(env.STRIPE_TOKEN);
    stripe.customers.create({
      name: `${payload.first_name} ${payload.last_name}`,
      email: payload.email_address,
    }).then(customer => {
      const customers = new ItemsService(collection, { schema: schema });
      customers.updateByQuery({ filter: { id: key } }, { stripe_id: customer.id }, { emitEvents: false });
    }).catch(error => {
      mailService.send({
        to: 'sharedmailbox@directus.io',
        from: 'noreply@directus.io',
        subject: `An error has occurred with Stripe API`,
        text: "The following error occurred for "+payload.first_name+" "+payload.last_name+" when attempting to create an account in Stripe.\r\n\r\n"+error+"\r\n\r\nPlease investigate.\r\n\r\nID: "+key+"\r\nEmail: "+payload.email_address,
      });
    });
  });
};
