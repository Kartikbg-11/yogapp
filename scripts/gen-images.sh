#!/bin/bash
cd /home/z/my-project/public/images
gen() {
  z-ai image -p "$1" -o "$2" -s "$3" > "$2.log" 2>&1 && echo "DONE $2" >> /home/z/my-project/scripts/gen-status.log || echo "FAIL $2" >> /home/z/my-project/scripts/gen-status.log
}
rm -f /home/z/my-project/scripts/gen-status.log
# batch 1
gen "Cinematic photo of a woman meditating in lotus pose on a mountain cliff edge at golden sunrise, misty valley and lake below, warm golden light rays, teal mountains, serene premium wellness aesthetic, soft volumetric light, high quality, detailed" "hero-sunrise.png" "1440x720" &
gen "Tranquil misty mountain lake at dawn, still water mirror reflection, pine forest, soft teal and warm cream tones, peaceful zen atmosphere, cinematic photography, high quality, detailed" "lake-quotes.png" "1344x768" &
gen "Sunlight rays streaming through misty ancient forest, moss covered stones, gentle stream, peaceful atmosphere, deep green and golden tones, cinematic nature photography, high quality, detailed" "forest-mist.png" "1344x768" &
gen "Person meditating cross legged by a calm misty lake at dawn, wooden dock, mountains in background, soft blue and teal tones, peaceful cinematic photography, premium wellness aesthetic, high quality, detailed" "meditation-lake.png" "1440x720" &
wait
# batch 2
gen "Warm golden ambiance with glowing Om symbol and traditional brass oil lamps, incense smoke curling, deep teal and amber tones, sacred spiritual meditation atmosphere, cinematic photography, high quality, detailed" "mantra-shiva.png" "1152x864" &
gen "Woman in gentle mountain yoga pose on wooden deck overlooking misty forest valley at sunrise, beginner friendly calm pose, warm cream and sage tones, serene premium wellness photography, high quality, detailed" "yoga-beginner.png" "1152x864" &
gen "Woman holding warrior two yoga pose at golden sunset on a cliff by the ocean, strong confident stance, warm golden light, teal accents, cinematic wellness photography, high quality, detailed" "yoga-intermediate.png" "1152x864" &
gen "Advanced yoga practitioner in crow arm balance pose on rocky outcrop overlooking mountain valley at dawn, dramatic misty landscape, focused strength, teal and gold tones, cinematic photography, high quality" "yoga-advanced.png" "1152x864" &
wait
# batch 3
gen "Person stretching in upward salute yoga pose on a beach at soft sunrise, gentle morning light, calm ocean waves, warm golden and cream tones, peaceful wellness photography, high quality, detailed" "yoga-morning.png" "1152x864" &
gen "Woman in restorative childs pose yoga on a mat at twilight by a calm lake, candles and soft lanterns nearby, deep blue and warm amber tones, peaceful evening atmosphere, cinematic photography, high quality" "yoga-evening.png" "1152x864" &
gen "Person seated in lotus pose practicing pranayama breathing with hands in mudra by a serene mountain stream, soft mist, deep green and teal tones, meditative calm, cinematic wellness photography, high quality" "yoga-breathing.png" "1152x864" &
gen "Woman in seated forward fold stretch yoga pose in a peaceful garden at golden hour, flexibility practice, soft warm light through trees, cream and sage green tones, premium wellness photography, high quality" "yoga-flexibility.png" "1152x864" &
wait
echo "ALL_DONE" >> /home/z/my-project/scripts/gen-status.log
