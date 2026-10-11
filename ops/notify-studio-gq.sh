#!/usr/bin/env bash
set -Eeuo pipefail
case ${1:-failure} in test|failure) mode=${1:-failure};; *) exit 2;; esac
docker exec -i -w /var/www/html -e STUDIO_GQ_ALERT_MODE="$mode" coolify php -d display_errors=0 <<'PHP'
<?php
try {
 require 'vendor/autoload.php';$app=require 'bootstrap/app.php';
 $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
 $settings=instanceSettings();$type=set_transanctional_email_settings($settings);
 if($type!=='resend'||config('mail.default')!=='resend')throw new \RuntimeException('Transport unavailable');
 $test=getenv('STUDIO_GQ_ALERT_MODE')==='test';
 $subject=$test?'Studio GQ server alerts test':'Studio GQ backup needs attention';
 $body=$test?'This is a controlled Studio GQ migration alert test. No client data is included. The live website has not been switched yet.':'The Studio GQ encrypted backup failed. Review the private Coolify/server logs. No client information is included in this alert.';
 $sent=\Illuminate\Support\Facades\Mail::raw($body,function(\Illuminate\Mail\Message $message)use($settings,$subject){mail_from_message($message,$settings)->to('nimda@rooiko.com')->subject($subject);});
 if($sent===null)throw new \RuntimeException('Not sent');
 fwrite(STDOUT,"STUDIO_GQ_ALERT_ACCEPTED_BY_TRANSPORT\n");
}catch(\Throwable $e){fwrite(STDERR,"STUDIO_GQ_ALERT_FAILED\n");exit(1);}
PHP
