// app/api/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {BrevoClient} from '@getbrevo/brevo'

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY || ''});


export async function POST(request: NextRequest) {
  try {
    

    // Prepare email content
    const sendSmtpEmail = {
       subject: 'Hello from Brevo!',
        htmlContent: '<html><body><p>Hello,</p><p>This is my first transactional email.</p></body></html>',
        sender: { name: 'Alex from Brevo', email: 'sinbikila21@gmail.com' },
        to: [{ email: 'betseab1@gmail.com', name: 'John Doe' }],
    };

    const response = await brevo.transactionalEmails.sendTransacEmail(sendSmtpEmail);
    console.log('Email sent successfully:', response);

    // Return success response
    return NextResponse.json(
      { 
        message: 'OTP sent successfully',
        messageId: response.messageId 
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error sending OTP:', error);

    // Handle specific Brevo errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
