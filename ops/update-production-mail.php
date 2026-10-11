<?php
try {
require '/var/www/html/vendor/autoload.php';
$app=require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$values=json_decode(file_get_contents('/tmp/sgq-mail-runtime.json'),true,512,JSON_THROW_ON_ERROR);
$keys=['RESEND_API_KEY','BOOKING_FROM_EMAIL','BOOKING_NOTIFICATION_EMAIL'];
foreach($keys as $key) if(!isset($values[$key]) || !is_string($values[$key]) || $values[$key]==='') throw new RuntimeException('Missing mail setting');
if($values['BOOKING_NOTIFICATION_EMAIL']!=='bookings@studiogq.co.za' || $values['BOOKING_FROM_EMAIL']!=='Studio GQ <web@rooiko.com>') throw new RuntimeException('Unexpected email identity');
$a=App\Models\Application::where('uuid','lhosiqfbxr4x6uqbwtjvetka')->firstOrFail();
if($a->name!=='studio-gq-production') throw new RuntimeException('Unexpected application');
App\Models\EnvironmentVariable::withoutEvents(function()use($a,$values,$keys){
 foreach($keys as $key){
  $v=App\Models\EnvironmentVariable::firstOrNew(['resourceable_type'=>App\Models\Application::class,'resourceable_id'=>$a->id,'key'=>$key,'is_preview'=>false]);
  if(!$v->exists)$v->uuid=Illuminate\Support\Str::random(24);
  $v->fill(['value'=>$values[$key],'is_runtime'=>true,'is_buildtime'=>false,'is_literal'=>true,'version'=>config('constants.coolify.version')]);$v->save();
 }
});
echo "STUDIO_GQ_PRODUCTION_MAIL_CONFIGURED_RUNTIME_ONLY\n";
} catch (Throwable $e) {
 fwrite(STDERR, "STUDIO_GQ_MAIL_CONFIGURATION_FAILED\n");
 exit(1);
}
