<?php
// Scope all operational flag updates to Studio GQ production, never other sites.
try {
 require '/var/www/html/vendor/autoload.php';
 $app=require '/var/www/html/bootstrap/app.php';
 $app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
 $mode=$argv[1]??'';
 if(!in_array($mode,['prepare','live'],true)) throw new RuntimeException('Invalid cutover mode');
 $a=App\Models\Application::where('uuid','lhosiqfbxr4x6uqbwtjvetka')->firstOrFail();
 if($a->name!=='studio-gq-production'||$a->git_repository!=='RustyMinyr/Studio_GQ_Website') throw new RuntimeException('Wrong application');
 if($mode==='live'&&($a->git_branch!=='main'||!str_contains($a->fqdn??'','www.studiogq.co.za'))) throw new RuntimeException('Production branch/domain is not prepared');
 foreach(['TURSO_AUTH_TOKEN','TURSO_DATABASE_URL'] as $key) {
  if(App\Models\EnvironmentVariable::where('resourceable_type',App\Models\Application::class)->where('resourceable_id',$a->id)->where('key',$key)->exists()) throw new RuntimeException('Migrated runtime must not have Turso credentials');
 }
 App\Models\EnvironmentVariable::withoutEvents(function()use($a,$mode){
  foreach(['MIGRATION_READ_ONLY'=>$mode==='prepare'?'1':'0','EMAIL_DELIVERY_DISABLED'=>$mode==='prepare'?'1':'0'] as $key=>$value){
   $v=App\Models\EnvironmentVariable::firstOrNew(['resourceable_type'=>App\Models\Application::class,'resourceable_id'=>$a->id,'key'=>$key,'is_preview'=>false]);
   if(!$v->exists)$v->uuid=Illuminate\Support\Str::random(24);
   $v->fill(['value'=>$value,'is_runtime'=>true,'is_buildtime'=>false,'is_literal'=>true,'version'=>config('constants.coolify.version')]);$v->save();
  }
 });
 echo 'STUDIO_GQ_PRODUCTION_MODE_'.strtoupper($mode).'_SAVED_REDEPLOY_REQUIRED'.PHP_EOL;
}catch(Throwable $e){fwrite(STDERR,"Studio GQ mode update failed; configuration was not approved.\n");exit(1);}
