param([switch]$DeepDive)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$demoRoot = Split-Path -Parent $PSScriptRoot
$demoOutput = Join-Path $demoRoot 'test-results/video'
if($DeepDive){$demoOutput = Join-Path $demoOutput 'deep-dive'}
New-Item -ItemType Directory -Path $demoOutput -Force | Out-Null
$storyboardFile = if($DeepDive){'storyboard-deep-dive.json'}else{'storyboard.json'}
$demoScenes = Get-Content -LiteralPath (Join-Path $PSScriptRoot $storyboardFile) -Raw -Encoding UTF8 | ConvertFrom-Json

function DemoBrush([string]$hex) { return [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml($hex)) }
function DemoFont([single]$size, [bool]$bold = $false) {
    $style = if ($bold) { [Drawing.FontStyle]::Bold } else { [Drawing.FontStyle]::Regular }
    return [Drawing.Font]::new('Segoe UI', $size, $style, [Drawing.GraphicsUnit]::Pixel)
}
function DemoText($graphics, [string]$text, [single]$size, [string]$color, [single]$x, [single]$y, [single]$w, [single]$h, [bool]$bold = $false) {
    $font = DemoFont $size $bold
    $brush = DemoBrush $color
    $format = [Drawing.StringFormat]::new()
    $format.Trimming = [Drawing.StringTrimming]::None
    $measured = $graphics.MeasureString($text,$font,[Drawing.SizeF]::new($w,10000),$format)
    if ($measured.Height -gt $h) { throw "Text exceeds frame: $text" }
    $graphics.DrawString($text, $font, $brush, [Drawing.RectangleF]::new($x,$y,$w,$h), $format)
    $font.Dispose(); $brush.Dispose(); $format.Dispose()
}
function DemoPicture($graphics,$scene,[single]$x,[single]$y,[single]$w,[single]$h) {
    $img=[Drawing.Image]::FromFile((Join-Path $PSScriptRoot ('assets/'+$scene.image)))
    $crop=$scene.crop
    if($crop[0]+$crop[2] -gt $img.Width -or $crop[1]+$crop[3] -gt $img.Height){throw "Crop exceeds source for $($scene.id)"}
    $scale=[Math]::Min($w/$crop[2],$h/$crop[3])
    $dw=[single]($crop[2]*$scale);$dh=[single]($crop[3]*$scale)
    $dest=[Drawing.RectangleF]::new([single]($x+($w-$dw)/2),[single]($y+($h-$dh)/2),$dw,$dh)
    $src=[Drawing.RectangleF]::new($crop[0],$crop[1],$crop[2],$crop[3])
    $graphics.DrawImage($img,$dest,$src,[Drawing.GraphicsUnit]::Pixel);$img.Dispose()
}

$demoIndex = 0
foreach ($scene in $demoScenes) {
    $demoIndex++
    $bitmap = [Drawing.Bitmap]::new(1920,1080)
    $g = [Drawing.Graphics]::FromImage($bitmap)
    $g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([Drawing.ColorTranslator]::FromHtml('#172835'))
    $cream = DemoBrush '#F5F5EE'; $white = DemoBrush '#FFFFFF'; $blue = DemoBrush '#535DF2'; $muted = DemoBrush '#263D4A'
    $g.FillRectangle($muted,0,944,1920,136)
    $g.FillRectangle($blue,80,56,36,36)
    DemoText $g 'S' 25 '#FFFFFF' 86 55 30 40 $true
    DemoText $g 'SpareCycle.' 32 '#FFFFFF' 133 50 300 55 $true
    $cutLabel = if($DeepDive){'REVIEW / BACKEND DEEP DIVE'}else{'REVIEW / PRODUCT DEMO'}
    DemoText $g $cutLabel 19 '#ACC0CB' 1490 63 370 38
    if($scene.layout -eq 'board'){
        DemoText $g $scene.chapter 22 '#B6C6D0' 80 139 1740 45 $true
        DemoText $g $scene.title 54 '#FFFFFF' 76 203 1780 82 $true
        DemoText $g $scene.detail 25 '#D2DFE6' 80 295 1760 75
        $columns = $scene.cards.Count
        $gap = 24
        $width = (1760 - ($columns - 1) * $gap) / $columns
        for($i=0;$i -lt $columns;$i++){
            $card=$scene.cards[$i];$x=80+$i*($width+$gap)
            $g.FillRectangle($cream,$x,405,$width,325)
            DemoText $g $card.tag 18 '#50685D' ($x+28) 437 ($width-56) 40 $true
            DemoText $g $card.title 34 '#20313F' ($x+26) 497 ($width-52) 98 $true
            DemoText $g $card.body 24 '#5E717C' ($x+28) 608 ($width-56) 108
        }
        $g.FillRectangle($muted,80,774,1760,94)
        DemoText $g $scene.note 26 '#DDE7EA' 107 794 1706 65
        DemoText $g $scene.label 20 '#CAD8DF' 80 902 1760 34
    } elseif($scene.layout -eq 'receipt'){
        DemoText $g $scene.chapter 22 '#B6C6D0' 80 139 1740 45 $true
        DemoText $g $scene.title 54 '#FFFFFF' 76 203 1780 82 $true
        DemoText $g $scene.detail 25 '#D2DFE6' 80 295 1760 60
        $rowY = 383
        foreach($row in $scene.rows){
            $g.FillRectangle($cream,80,$rowY,1760,92)
            DemoText $g $row.key 27 '#5E717C' 106 ($rowY+25) 445 54
            DemoText $g $row.value 28 '#20313F' 585 ($rowY+24) 1215 58 $true
            $rowY+=102
        }
        DemoText $g $scene.note 24 '#DDE7EA' 80 814 1760 65
        DemoText $g $scene.label 20 '#CAD8DF' 80 902 1760 34
    } elseif($scene.layout -eq 'wide'){
        DemoText $g $scene.chapter 22 '#B6C6D0' 80 139 1740 45 $true
        DemoText $g $scene.title 54 '#FFFFFF' 76 203 1780 82 $true
        DemoText $g $scene.detail 25 '#D2DFE6' 80 291 1760 42
        DemoPicture $g $scene 80 350 1760 530
        DemoText $g $scene.label 20 '#CAD8DF' 80 902 1760 34
    } elseif($scene.layout -eq 'proof'){
        DemoText $g $scene.chapter 22 '#B6C6D0' 80 139 1740 45 $true
        DemoText $g $scene.title 54 '#FFFFFF' 76 203 1780 82 $true
        DemoText $g $scene.detail 25 '#D2DFE6' 80 291 1760 42
        $g.FillRectangle($cream,80,362,760,290)
        $g.FillRectangle($cream,1080,362,760,290)
        DemoText $g 'Baseline' 25 '#67777F' 115 390 685 45
        DemoText $g '1 failed' 76 '#A14F32' 110 449 685 120 $true
        DemoText $g '3 passed / original code' 26 '#5E717C' 115 577 685 49
        DemoText $g '→' 70 '#AEB5FF' 932 454 120 120
        DemoText $g 'Candidate' 25 '#67777F' 1115 390 685 45
        DemoText $g '4 passed' 76 '#41694F' 1110 449 685 120 $true
        DemoText $g '0 failed / unchanged tests' 26 '#5E717C' 1115 577 685 49
        $proofTitles=@('Encrypted dispatch','Private test workflow','Separate approver','Draft PR created')
        $proofDetails=@('Bound to this verification job','Runs in the same private repository','Self-approval was rejected','Ready for repository review')
        for($i=0;$i -lt 4;$i++){
            $x=80+$i*440
            $g.FillRectangle($muted,$x,701,405,140)
            DemoText $g $proofTitles[$i] 26 '#FFFFFF' ($x+19) 722 367 43 $true
            DemoText $g $proofDetails[$i] 20 '#D2DFE6' ($x+19) 771 367 60
        }
        DemoText $g $scene.label 20 '#CAD8DF' 80 902 1760 34
    } elseif($scene.layout -eq 'diagram'){
        DemoText $g $scene.chapter 22 '#B6C6D0' 80 139 1740 45 $true
        DemoText $g $scene.title 52 '#FFFFFF' 76 203 1780 82 $true
        DemoText $g $scene.detail 25 '#D2DFE6' 80 291 1760 42
        $titles=@('Versioned input','NVIDIA Nemotron','Isolated tests','Review + approval')
        $bodies=@("Passport evidence`nRepository snapshot","Strict JSON output`nNo shell or publishing tools","Original failure reproduced`nSame tests pass on the fix","Fresh model review`nDifferent organization member")
        $tags=@('OBSERVE','REASON','VERIFY','AUTHORIZE')
        for($i=0;$i -lt 4;$i++){
            $x=80+$i*440
            $g.FillRectangle($cream,$x,370,405,188)
            DemoText $g $tags[$i] 17 '#50685D' ($x+22) 391 363 30 $true
            DemoText $g $titles[$i] 30 '#20313F' ($x+22) 430 363 49 $true
            DemoText $g $bodies[$i] 21 '#5E717C' ($x+22) 486 363 70
            if($i -lt 3){DemoText $g '→' 29 '#AEB5FF' ($x+407) 442 33 55}
        }
        $controlTitles=@('40-second deadline','Reserved stage budget','Code + evidence hashes','Stale evidence rejected')
        $controlDetails=@('Bounded model calls','Spend checked before a call','Exact inputs, patch and proof','A new revision needs a new review')
        for($i=0;$i -lt 4;$i++){
            $x=80+$i*440
            $g.FillRectangle($muted,$x,606,405,125)
            DemoText $g $controlTitles[$i] 25 '#FFFFFF' ($x+19) 625 367 43 $true
            DemoText $g $controlDetails[$i] 18 '#D2DFE6' ($x+19) 672 367 45
        }
        $g.FillRectangle($blue,80,784,405,78)
        DemoText $g 'Only then: a draft PR' 28 '#FFFFFF' 101 802 368 47 $true
        DemoText $g 'LangSmith: metadata-only traces' 29 '#FFFFFF' 530 782 1270 49 $true
        DemoText $g 'Source and diagnostic narratives stay out of trace inputs and outputs.' 23 '#D2DFE6' 530 831 1270 42
        DemoText $g $scene.label 20 '#CAD8DF' 80 902 1760 34
    } else {
    DemoText $g $scene.chapter 22 '#B6C6D0' 80 142 520 68 $true
    DemoText $g $scene.title 58 '#FFFFFF' 76 238 525 255 $true
    $g.FillRectangle($blue,80,528,60,4)
    DemoText $g $scene.eyebrow 19 '#AEB5FF' 80 560 480 75 $true
    DemoText $g $scene.detail 27 '#D2DFE6' 80 655 480 230
    $g.FillRectangle($cream,640,158,1200,728)
    $g.FillRectangle($white,651,170,1178,703)
    DemoPicture $g $scene 651 170 1178 703
    DemoText $g $scene.label 19 '#CAD8DF' 643 901 1200 34
    DemoText $g ('{0:00} / {1:00}' -f $demoIndex,$demoScenes.Count) 20 '#AABEC9' 80 898 230 38
    }
    $bitmap.Save((Join-Path $demoOutput ($scene.id+'.png')),[Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bitmap.Dispose(); $cream.Dispose(); $white.Dispose(); $blue.Dispose(); $muted.Dispose()
}
Write-Output "Rendered $($demoScenes.Count) editorial frames from genuine UI captures."
