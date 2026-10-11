$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$demoRoot = Split-Path -Parent $PSScriptRoot
$demoOutput = Join-Path $demoRoot 'test-results/video'
New-Item -ItemType Directory -Path $demoOutput -Force | Out-Null
$demoScenes = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'storyboard.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$voice = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$voice.SelectVoice('Microsoft Zira Desktop')
$voice.Rate = 2
$voice.Volume = 100
foreach ($scene in $demoScenes) {
    $cue = 0
    foreach ($caption in $scene.captions) {
        $voice.SetOutputToWaveFile((Join-Path $demoOutput ($scene.id+'-'+$cue+'.wav')))
        $voice.Speak($caption)
        $voice.SetOutputToNull()
        $cue++
    }
}
$voice.Dispose()
Write-Output 'Rendered local narration; no cloud speech service was used.'
