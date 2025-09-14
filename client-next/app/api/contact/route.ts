import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // For now, we'll simulate sending an email
    // In a real implementation, you would:
    // 1. Use a service like SendGrid, Mailgun, or AWS SES
    // 2. Send the email to your support team
    // 3. Optionally send a confirmation email to the user

    console.log('Contact form submission:', {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    // TODO: Implement actual email sending
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to: 'support@beyondwords.com',
    //   from: 'noreply@beyondwords.com',
    //   subject: `Contact Form: ${subject}`,
    //   text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
    //   html: `<h2>New Contact Form Submission</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Subject:</strong> ${subject}</p><p><strong>Message:</strong></p><p>${message}</p>`,
    // };
    // await sgMail.send(msg);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Your message has been sent successfully. We\'ll get back to you soon!' 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message. Please try again later.' 
      },
      { status: 500 }
    );
  }
} 