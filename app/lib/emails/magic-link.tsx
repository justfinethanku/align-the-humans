/**
 * Magic Link Email Template
 *
 * Sent by Supabase Auth for passwordless login.
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';
import { baseStyles, colors } from './styles';

interface MagicLinkEmailProps {
  magicLinkUrl: string;
  appUrl: string;
}

export function MagicLinkEmail({
  magicLinkUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            Sign in to Human Alignment
          </Text>
          <Text style={baseStyles.text}>
            Click the button below to sign in to your account. This link
            expires in 1 hour.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={magicLinkUrl}>
              Sign In
            </Button>
          </Section>
          <Text style={{ ...baseStyles.text, fontSize: '13px' }}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
          <Hr style={baseStyles.divider} />
          <Text style={baseStyles.footer}>
            <Link href={appUrl} style={baseStyles.link}>
              Human Alignment
            </Link>{' '}
            — Structure for every decision that matters.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default MagicLinkEmail;
