/* Seed script: default mantras, yoga routines, and a demo account with history.
   Run with: bun run prisma/seed.ts */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const db = new PrismaClient()

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const MANTRAS = [
  { name: 'Om (Aum)', text: 'ॐ', meaning: 'The primordial sound of the universe; the vibration of existence itself.' },
  { name: 'Om Namah Shivaya', text: 'ॐ नमः शिवाय', meaning: 'I bow to Shiva, the innermost Self and auspicious consciousness.' },
  { name: 'Hare Krishna Maha Mantra', text: 'हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे। हरे राम हरे राम, राम राम हरे हरे॥', meaning: 'A prayer for divine joy and spiritual energy, calling upon the Supreme.' },
  { name: 'Gayatri Mantra', text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्', meaning: 'May the divine light illuminate our intellect and guide our path.' },
  { name: 'Om Mani Padme Hum', text: 'ॐ मणि पद्मे हूँ', meaning: 'The jewel in the lotus; compassion and wisdom arising together.' },
  { name: 'So Hum', text: 'सो ऽहम्', meaning: 'I am That — the breath mantra connecting individual and universal consciousness.' },
]

interface Pose {
  name: string
  sanskritName?: string
  durationSec: number
  instructions: string
  safety?: string
}

interface Routine {
  title: string
  slug: string
  category: string
  level: string
  durationMin: number
  imageKey: string
  description: string
  benefits: string[]
  safety: string[]
  poses: Pose[]
}

const ROUTINES: Routine[] = [
  {
    title: 'Beginner Yoga Flow',
    slug: 'beginner-yoga-flow',
    category: 'morning',
    level: 'beginner',
    durationMin: 15,
    imageKey: 'yoga-beginner',
    description: 'A gentle full-body wake-up flow for those new to yoga. Moves slowly through foundational poses with plenty of breath awareness.',
    benefits: ['Gently wakes up the body and spine', 'Builds foundational alignment awareness', 'Boosts morning energy and circulation', 'Calms the nervous system before the day begins'],
    safety: ['Move within a pain-free range', 'Keep knees slightly bent if hamstrings feel tight'],
    poses: [
      { name: 'Child\u2019s Pose', sanskritName: 'Balasana', durationSec: 60, instructions: 'Kneel and sit back on your heels, fold forward with arms extended. Breathe slowly into your lower back, softening your shoulders.', safety: 'Place a cushion between calves and thighs if knees feel strained.' },
      { name: 'Cat-Cow Stretch', sanskritName: 'Marjaryasana-Bitilasana', durationSec: 90, instructions: 'On all fours, alternate arching your spine as you inhale (cow) and rounding it as you exhale (cat). Move with your breath at a gentle rhythm.', safety: 'Keep wrists under shoulders; drop to forearms if wrists ache.' },
      { name: 'Downward Facing Dog', sanskritName: 'Adho Mukha Svanasana', durationSec: 60, instructions: 'Tuck your toes and lift your hips up and back into an inverted V. Press evenly through your palms and let your head hang heavy.', safety: 'Bend your knees generously — the shape matters more than straight legs.' },
      { name: 'Mountain Pose', sanskritName: 'Tadasana', durationSec: 60, instructions: 'Stand tall with feet hip-width apart, ground through all four corners of your feet, engage your thighs and lengthen your crown toward the sky.', safety: 'Keep a soft micro-bend in the knees to avoid locking joints.' },
      { name: 'Upward Salute Stretch', sanskritName: 'Urdhva Hastasana', durationSec: 60, instructions: 'Inhale and sweep your arms overhead, interlace fingers and lean gently to each side, lengthening the side body with each breath.', safety: 'Avoid arching the lower back; keep ribs stacked over pelvis.' },
      { name: 'Seated Breath Awareness', sanskritName: 'Sukhasana', durationSec: 120, instructions: 'Sit cross-legged with a tall spine. Close your eyes and follow your natural breath — inhale for 4, exhale for 6.', safety: 'Sit on a cushion to keep hips above knees.' },
    ],
  },
  {
    title: 'Desk Worker Reset',
    slug: 'desk-worker-reset',
    category: 'flexibility',
    level: 'beginner',
    durationMin: 12,
    imageKey: 'yoga-beginner',
    description: 'Targeted stretches to undo hours of sitting: neck, shoulders, wrists, hips and spine. Perfect for a midday break at the office or home desk.',
    benefits: ['Releases neck and shoulder tension', 'Opens tight hip flexors from sitting', 'Relieves wrist strain from typing', 'Refreshes focus and posture'],
    safety: ['Never stretch into sharp pain', 'Move slowly between shapes'],
    poses: [
      { name: 'Neck Release', durationSec: 60, instructions: 'Seated tall, drop your right ear toward your right shoulder. Hold 30 seconds feeling the stretch along the left side of your neck, then switch sides.', safety: 'Do not pull on your head — let gravity do the work.' },
      { name: 'Seated Cat-Cow', durationSec: 60, instructions: 'Sitting in a chair with hands on knees, arch your chest forward on the inhale and round your spine on the exhale. Repeat slowly.', safety: 'Keep movements small and controlled.' },
      { name: 'Eagle Arms', sanskritName: 'Garudasana Arms', durationSec: 60, instructions: 'Wrap your right arm under your left, bring palms to touch, and lift elbows to shoulder height. Breathe into your upper back, then switch sides.', safety: 'If palms cannot touch, hold opposite shoulders.' },
      { name: 'Seated Spinal Twist', sanskritName: 'Ardha Matsyendrasana', durationSec: 90, instructions: 'Seated, place your right hand on your left knee and twist gently to the left, lengthening your spine on each inhale, deepening slightly on each exhale. Switch sides.', safety: 'Twist from the ribs, not by pushing hard on the knee.' },
      { name: 'Wrist and Finger Stretch', durationSec: 60, instructions: 'Extend your right arm, palm up, and gently press your fingers down with your left hand. Then flip the palm and stretch the other way. Switch hands.', safety: 'Ease off if you feel tingling.' },
      { name: 'Standing Forward Fold', sanskritName: 'Uttanasana', durationSec: 90, instructions: 'Stand and hinge forward from your hips, letting your head and arms hang heavy. Bend your knees as much as you like and sway gently.', safety: 'Rise slowly to avoid dizziness.' },
      { name: 'Chest Opener at Wall', durationSec: 60, instructions: 'Stand facing away, clasp hands behind your back and open your chest toward the sky, lifting your heart. Breathe deeply into your collarbones.', safety: 'Keep neck neutral — do not tip the head back.' },
    ],
  },
  {
    title: 'Morning Sun Salutation',
    slug: 'morning-sun-salutation',
    category: 'morning',
    level: 'beginner',
    durationMin: 18,
    imageKey: 'yoga-morning',
    description: 'A flowing sequence honoring the sunrise. Links breath with movement through classic Surya Namaskar rounds to build warmth and energy.',
    benefits: ['Builds gentle heat and circulation', 'Energizes the whole body for the day', 'Improves breath-body coordination'],
    safety: ['Skip deep backbends if you have lower back issues', 'Keep a steady, unhurried pace'],
    poses: [
      { name: 'Mountain Pose & Breath', sanskritName: 'Tadasana', durationSec: 60, instructions: 'Stand tall at the top of your mat. Take 5 slow deep breaths, setting an intention for your practice.', safety: 'Ground evenly through both feet.' },
      { name: 'Upward Salute', sanskritName: 'Urdhva Hastasana', durationSec: 45, instructions: 'Inhale, sweep your arms up and gently arch back, gazing up at your hands.', safety: 'Keep the arch gentle and supported by your core.' },
      { name: 'Standing Forward Fold', sanskritName: 'Uttanasana', durationSec: 60, instructions: 'Exhale, hinge from the hips and fold forward. Let your knees bend as needed and your head hang heavy.', safety: 'Micro-bend knees to protect hamstrings.' },
      { name: 'Half Lift', sanskritName: 'Ardha Uttanasana', durationSec: 45, instructions: 'Inhale, slide hands to shins and lengthen your spine forward into a flat back.', safety: 'Press firmly into your sit bones lifting the tailbone.' },
      { name: 'Plank Pose', sanskritName: 'Phalakasana', durationSec: 60, instructions: 'Step back into a high push-up position. Align shoulders over wrists and make one long line from crown to heels.', safety: 'Drop to knees if the lower back sags.' },
      { name: 'Cobra Pose', sanskritName: 'Bhujangasana', durationSec: 60, instructions: 'Lower to the floor, hands under shoulders. Inhale and lift your chest, keeping elbows softly bent and shoulders away from ears.', safety: 'Keep the pubic bone grounded; lift only as high as is comfortable.' },
      { name: 'Downward Facing Dog', sanskritName: 'Adho Mukha Svanasana', durationSec: 90, instructions: 'Tuck toes, lift hips high and back. Pedal your feet gently, then hold for 5 breaths feeling the whole body wake up.', safety: 'Bend knees to keep the spine long.' },
      { name: 'Three Rounds Flow', durationSec: 300, instructions: 'Flow gently at your own pace: fold, half-lift, plank, cobra, downward dog, step forward and rise with arms overhead. Complete three full rounds syncing one breath per movement.', safety: 'Rest in child\u2019s pose anytime.' },
      { name: 'Closing Breath', sanskritName: 'Sukhasana', durationSec: 90, instructions: 'Return to seated. Take 8 deep breaths, noticing the energy you have created.', safety: 'Keep the spine tall but relaxed.' },
    ],
  },
  {
    title: 'Warrior Strength Flow',
    slug: 'warrior-strength-flow',
    category: 'strength',
    level: 'intermediate',
    durationMin: 25,
    imageKey: 'yoga-intermediate',
    description: 'A powerful standing sequence building heat, leg strength and confidence through Warrior I, II, III and extended side angle holds.',
    benefits: ['Builds lower body strength and stamina', 'Improves balance and hip stability', 'Develops focus and mental resilience'],
    safety: ['Back knee issues: shorten the stance', 'Keep front knee tracking over the ankle'],
    poses: [
      { name: 'Sun Breath Warm-up', durationSec: 60, instructions: 'Stand tall and take 6 arm-sweeping breaths to center yourself.', safety: 'Keep the movement smooth and supported.' },
      { name: 'Warrior I', sanskritName: 'Virabhadrasana I', durationSec: 90, instructions: 'Step your left foot back 3-4 feet, bend your right knee over the ankle, square your hips forward and reach your arms up. Hold with strong legs. Switch sides.', safety: 'Keep the back heel grounded at 45 degrees.' },
      { name: 'Warrior II', sanskritName: 'Virabhadrasana II', durationSec: 90, instructions: 'Open hips and shoulders to the side, gaze over your front fingers, and sink your front thigh toward parallel with the floor. Switch sides.', safety: 'Do not let the front knee collapse inward.' },
      { name: 'Extended Side Angle', sanskritName: 'Utthita Parsvakonasana', durationSec: 90, instructions: 'From Warrior II, lower your front forearm to your thigh and reach the other arm overhead, making one long line from foot to fingertips. Switch sides.', safety: 'Keep the top shoulder stacked, not collapsing forward.' },
      { name: 'Warrior III', sanskritName: 'Virabhadrasana III', durationSec: 90, instructions: 'From standing, hinge forward as one leg lifts behind you to hip height, forming a T shape. Engage your core and hold. Switch sides.', safety: 'Use a wall or block under your hand for balance.' },
      { name: 'Goddess Squats', sanskritName: 'Utkata Konasana', durationSec: 90, instructions: 'Step wide, toes out 45 degrees, and bend knees over ankles sinking into a squat. Pulse gently with your breath.', safety: 'Keep tailbone lengthening down, not tucking hard.' },
      { name: 'Tree Pose', sanskritName: 'Vrksasana', durationSec: 90, instructions: 'Stand on one leg, place the other foot on your inner calf or thigh (never the knee), and bring palms together overhead. Switch sides.', safety: 'Keep a light fingertip touch on a wall if balance wavers.' },
      { name: 'Cool Down Forward Fold', sanskritName: 'Prasarita Padottanasana', durationSec: 120, instructions: 'Step wide, fold forward between your legs, letting your head release. Sway gently and breathe into your hamstrings.', safety: 'Bend knees generously if hamstrings complain.' },
    ],
  },
  {
    title: 'Deep Flexibility Stretch',
    slug: 'deep-flexibility-stretch',
    category: 'flexibility',
    level: 'intermediate',
    durationMin: 30,
    imageKey: 'yoga-flexibility',
    description: 'Long-held floor stretches targeting hips, hamstrings and spine. A yin-inspired practice that invites deep release and patience.',
    benefits: ['Deeply releases hips and hamstrings', 'Increases range of motion', 'Calms the mind through long holds'],
    safety: ['Find your edge, then breathe — never force', 'Support knees with cushions as needed'],
    poses: [
      { name: 'Butterfly Fold', sanskritName: 'Baddha Konasana', durationSec: 180, instructions: 'Sit with soles of the feet together and knees wide. Fold forward from the hips, letting your head grow heavy. Breathe into your inner thighs.', safety: 'Sit on a cushion if the back rounds painfully.' },
      { name: 'Seated Forward Fold', sanskritName: 'Paschimottanasana', durationSec: 180, instructions: 'Extend both legs forward, hinge at the hips and walk your hands toward your feet. Let your spine round naturally in the last third of the hold.', safety: 'Bend knees slightly to protect the lower back.' },
      { name: 'Pigeon Pose', sanskritName: 'Eka Pada Rajakapotasana', durationSec: 180, instructions: 'Bring your right shin forward between your hands and extend the left leg back. Square your hips and fold over the front leg. Switch sides.', safety: 'Place a blanket under the front hip to level the pelvis.' },
      { name: 'Wide-Legged Fold', sanskritName: 'Upavistha Konasana', durationSec: 180, instructions: 'Straddle your legs wide, walk your hands forward and fold. Keep the kneecaps facing the sky.', safety: 'Support your head on a block or cushion.' },
      { name: 'Supine Twist', sanskritName: 'Supta Matsyendrasana', durationSec: 150, instructions: 'Lie on your back, hug your right knee in and guide it across your body to the left. Extend your right arm and look right. Switch sides.', safety: 'Keep both shoulders as grounded as comfortable.' },
      { name: 'Happy Baby', sanskritName: 'Ananda Balasana', durationSec: 120, instructions: 'Lie back, grab the outer edges of your feet, and draw knees toward armpits. Rock gently side to side massaging the lower back.', safety: 'Keep tailbone heavy on the floor.' },
      { name: 'Savasana Integration', sanskritName: 'Corpse Pose', durationSec: 180, instructions: 'Lie flat, palms up, feet falling open. Let every muscle melt toward the floor. Simply breathe and receive.', safety: 'Cover yourself with a blanket to stay warm.' },
    ],
  },
  {
    title: 'Advanced Balance & Inversion',
    slug: 'advanced-balance-inversion',
    category: 'strength',
    level: 'advanced',
    durationMin: 35,
    imageKey: 'yoga-advanced',
    description: 'A challenging practice for experienced practitioners: arm balances, inversions and advanced holds with careful progressions.',
    benefits: ['Builds upper body and core power', 'Develops deep concentration and body control', 'Cultivates courage and calm under pressure'],
    safety: ['Practice near a wall for inversions', 'Never kick into balance — rise with control', 'Skip inversions if you have neck or blood pressure concerns'],
    poses: [
      { name: 'Dynamic Warm-up Flow', durationSec: 240, instructions: 'Flow through 5 rounds of sun salutation B at a steady, strong pace to fully warm the shoulders, core and legs.', safety: 'Maintain clean alignment over speed.' },
      { name: 'Crow Pose', sanskritName: 'Bakasana', durationSec: 120, instructions: 'From a squat, place hands shoulder-width, hook knees onto the backs of the upper arms and shift weight forward until the feet lift. Hold 5-8 breaths. Repeat 3 times.', safety: 'Look slightly forward, never straight down, to protect the neck.' },
      { name: 'Side Crow Progression', sanskritName: 'Parsva Bakasana', durationSec: 120, instructions: 'Twist from your squat, hook both knees over one upper arm and lean in until the feet lift. Practice each side mindfully.', safety: 'Build up from crow before attempting.' },
      { name: 'Headstand at Wall', sanskritName: 'Sirsasana', durationSec: 180, instructions: 'Interlace fingers, crown of head down, walk feet in and lift one leg at a time with core control. Hold up to 60 seconds against a wall. Come down slowly.', safety: 'Keep most weight in the arms, not the head. Exit slowly to avoid dizziness.' },
      { name: 'Forearm Stand Progression', sanskritName: 'Pincha Mayurasana', durationSec: 180, instructions: 'Forearms down, walk feet in and hop lightly to stack hips over shoulders at the wall. Practice small controlled kicks.', safety: 'Do not arch the lower back; press firmly through forearms.' },
      { name: 'Eight-Angle Pose', sanskritName: 'Astavakrasana', durationSec: 120, instructions: 'Seated, hook your right leg over your right shoulder, plant hands, cross ankles and extend legs to the side. Lower with control. Switch sides.', safety: 'Requires open hamstrings and strong wrists — approach gradually.' },
      { name: 'Wheel Pose', sanskritName: 'Urdhva Dhanurasana', durationSec: 180, instructions: 'Lie back, hands by your ears, and press up into a full backbend. Breathe deeply for 3 rounds of 5 breaths, lowering slowly between rounds.', safety: 'Keep knees tracking over ankles; push evenly through hands.' },
      { name: 'Extended Savasana', sanskritName: 'Savasana', durationSec: 240, instructions: 'Lie down and completely release. Let the nervous system integrate the practice in deep stillness.', safety: 'Use an eye pillow and blanket for comfort.' },
    ],
  },
  {
    title: 'Evening Wind-Down',
    slug: 'evening-wind-down',
    category: 'relaxation',
    level: 'beginner',
    durationMin: 18,
    imageKey: 'yoga-evening',
    description: 'A soothing candlelit sequence to release the day: gentle twists, supported rests and slow breathing that prepare the body for deep sleep.',
    benefits: ['Melts away the tension of the day', 'Activates the parasympathetic nervous system', 'Prepares body and mind for restful sleep'],
    safety: ['Keep all movements slow and low to the ground', 'Use cushions and blankets generously'],
    poses: [
      { name: 'Seated Side Breathing', durationSec: 90, instructions: 'Sit comfortably, interlace fingers overhead and lean gently side to side with long slow exhales.', safety: 'Keep the neck soft and jaw relaxed.' },
      { name: 'Gentle Neck Circles', durationSec: 60, instructions: 'Drop your chin to your chest and roll your head slowly in half circles from shoulder to shoulder.', safety: 'Avoid rolling the head fully backward.' },
      { name: 'Knees-to-Chest Rock', sanskritName: 'Apanasana', durationSec: 90, instructions: 'Lie back and hug both knees in, gently rocking side to side to massage the lower back.', safety: 'Keep the head and shoulders relaxed on the floor.' },
      { name: 'Supine Butterfly', sanskritName: 'Supta Baddha Konasana', durationSec: 180, instructions: 'Lie back with soles of the feet together and knees falling wide. Place cushions under the thighs. Rest here and breathe slowly.', safety: 'Support the knees so hips never strain.' },
      { name: 'Legs Up the Wall', sanskritName: 'Viparita Karani', durationSec: 240, instructions: 'Lie on your back with legs extended up a wall or resting on a chair. Let arms fall open. Breathe deeply and slowly.', safety: 'Scoot hips as close to the wall as comfortable.' },
      { name: 'Twisted Roots', sanskritName: 'Parivrtta Supta', durationSec: 150, instructions: 'Still lying down, cross your right knee over the left and guide both legs gently to the left. Breathe into your lower back. Switch sides.', safety: 'Never force the twist — let gravity do the work.' },
      { name: 'Candlelit Savasana', sanskritName: 'Savasana', durationSec: 300, instructions: 'Lie flat in dim light, cover with a blanket, and progressively relax from toes to crown. Exhale the entire day away.', safety: 'Keep warm; an eye pillow deepens the release.' },
    ],
  },
  {
    title: 'Pranayama Breathing Journey',
    slug: 'pranayama-breathing-journey',
    category: 'breathing',
    level: 'beginner',
    durationMin: 10,
    imageKey: 'yoga-breathing',
    description: 'A guided breathing session exploring three classical pranayama techniques to balance energy and steady the mind.',
    benefits: ['Balances the nervous system', 'Increases lung capacity and breath awareness', 'Clears mental fog and anxiety'],
    safety: ['Never strain the breath', 'Stop if you feel light-headed and return to natural breathing'],
    poses: [
      { name: 'Diaphragmatic Breathing', durationSec: 120, instructions: 'Sit tall with one hand on your belly. Breathe so the belly expands on the inhale and softens on the exhale. Find a slow, even rhythm.', safety: 'Keep the chest and shoulders relaxed.' },
      { name: 'Alternate Nostril Breathing', sanskritName: 'Nadi Shodhana', durationSec: 180, instructions: 'Close the right nostril with your thumb, inhale left. Close left with your ring finger, exhale right. Inhale right, exhale left — that is one round. Continue slowly for 8 rounds.', safety: 'Keep the breath smooth, never forceful.' },
      { name: 'Box Breathing', sanskritName: 'Sama Vritti', durationSec: 150, instructions: 'Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Visualize tracing the four sides of a square with each cycle.', safety: 'Reduce counts to 3 if holds feel stressful.' },
      { name: 'Humming Bee Breath', sanskritName: 'Bhramari', durationSec: 120, instructions: 'Inhale deeply, then exhale with a low gentle hum, feeling the vibration in your skull and chest. Repeat 6 times.', safety: 'Keep the hum soft and comfortable.' },
      { name: 'Ocean Breath', sanskritName: 'Ujjayi', durationSec: 120, instructions: 'Slightly constrict the back of your throat so the breath sounds like distant waves. Breathe slowly through the nose in and out.', safety: 'The sound should be gentle, not loud.' },
      { name: 'Stillness Integration', durationSec: 90, instructions: 'Sit in complete silence and simply watch your natural breath. Notice how calm and clear the mind has become.', safety: 'Let go of all technique — just be.' },
    ],
  },
]

async function main() {
  console.log('Seeding InnerPeace database...')

  /* ---------- default mantras (global, userId null) ---------- */
  const mantraCount = await db.mantra.count({ where: { userId: null } })
  if (mantraCount === 0) {
    await db.mantra.createMany({ data: MANTRAS })
    console.log(`Seeded ${MANTRAS.length} default mantras`)
  }

  /* ---------- yoga routines ---------- */
  const routineCount = await db.yogaRoutine.count()
  if (routineCount === 0) {
    for (const r of ROUTINES) {
      await db.yogaRoutine.create({
        data: {
          title: r.title,
          slug: r.slug,
          category: r.category,
          level: r.level,
          durationMin: r.durationMin,
          imageKey: r.imageKey,
          description: r.description,
          benefits: JSON.stringify(r.benefits),
          safety: JSON.stringify(r.safety),
          poses: JSON.stringify(r.poses),
        },
      })
    }
    console.log(`Seeded ${ROUTINES.length} yoga routines`)
  }

  /* ---------- demo user with realistic history ---------- */
  const demoEmail = 'demo@innerpeace.app'
  let demo = await db.user.findUnique({ where: { email: demoEmail } })
  if (!demo) {
    demo = await db.user.create({
      data: {
        email: demoEmail,
        name: 'Kartik',
        passwordHash: hashPassword('innerpeace123'),
        preference: {
          create: {
            theme: 'dark',
            dailyReminder: true,
            reminderTime: '06:30',
          },
        },
      },
    })

    const mantras = await db.mantra.findMany({ where: { userId: null } })
    const routines = await db.yogaRoutine.findMany()
    const ambients = ['rain', 'ocean', 'forest', 'wind', 'bells']
    let rand = 42 // deterministic pseudo-random
    const rnd = (n: number) => {
      rand = (rand * 1103515245 + 12345) % 2147483648
      return Math.abs(rand) % n
    }

    // 14 days of history
    for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
      const base = new Date()
      base.setDate(base.getDate() - daysAgo)
      base.setHours(6 + rnd(10), rnd(50), 0, 0)
      if (base.getTime() > Date.now()) base.setTime(Date.now() - 3600_000)

      const skipDay = rnd(10) === 0 // occasional rest day
      if (skipDay) continue

      // yoga every other-ish day
      if (rnd(10) < 6 && routines.length > 0) {
        const routine = routines[rnd(routines.length)]
        await db.yogaSession.create({
          data: {
            userId: demo.id,
            routineId: routine.id,
            routineTitle: routine.title,
            durationSec: routine.durationMin * 60 - rnd(120),
            completed: true,
            createdAt: base,
          },
        })
      }

      // meditation most days
      if (rnd(10) < 7) {
        const mins = [5, 10, 10, 15, 20][rnd(5)]
        await db.meditationSession.create({
          data: {
            userId: demo.id,
            plannedSec: mins * 60,
            durationSec: mins * 60 - rnd(60),
            ambient: ambients[rnd(ambients.length)],
            completed: true,
            createdAt: new Date(base.getTime() + 3600_000),
          },
        })
      }

      // chanting most days
      if (rnd(10) < 7 && mantras.length > 0) {
        const mantra = mantras[rnd(mantras.length)]
        const target = 108
        const finished = rnd(10) < 8
        await db.chantSession.create({
          data: {
            userId: demo.id,
            mantraId: mantra.id,
            mantraName: mantra.name,
            count: finished ? target : 27 + rnd(50),
            target,
            durationSec: 600 + rnd(600),
            completed: finished,
            createdAt: new Date(base.getTime() + 5400_000),
          },
        })
      }

      // journal entries every ~3 days
      if (daysAgo % 3 === 1) {
        const entries = [
          { title: 'Grateful for small things', content: 'Today I am grateful for the morning stillness, a warm cup of chai, and the birds singing outside my window. Practicing gratitude makes ordinary days feel abundant.', category: 'gratitude', mood: 'peaceful' },
          { title: 'Meditation was deep today', content: 'Sat for 15 minutes by the window. The mind wandered at first but around minute seven something shifted — the breath became effortless and thoughts spaced out like clouds.', category: 'meditation', mood: 'calm' },
          { title: 'Feeling stronger in Warrior II', content: 'Held Warrior II noticeably longer without shaking. The hips feel more open than last month. Flexibility is definitely improving with consistent practice.', category: 'goals', mood: 'energized' },
          { title: 'A busy mind before sleep', content: 'Work was hectic today. The evening wind-down routine really helped — legs up the wall is quickly becoming my favorite pose to decompress.', category: 'reflection', mood: 'tired but hopeful' },
        ]
        const e = entries[(daysAgo / 3) % entries.length | 0]
        await db.journalEntry.create({
          data: {
            userId: demo.id,
            title: e.title,
            content: e.content,
            category: e.category,
            mood: e.mood,
            entryDate: base.toISOString().slice(0, 10),
            createdAt: base,
          },
        })
      }
    }

    // milestones for demo
    const ms = [
      { key: 'first_session', title: 'First Steps', description: 'Completed your first wellness session', icon: 'sparkles' },
      { key: 'chants_108', title: 'Sacred 108', description: 'Chanted 108 total repetitions', icon: 'om' },
      { key: 'streak_7', title: 'Unbroken Week', description: 'Maintained a 7-day practice streak', icon: 'flame' },
      { key: 'meditation_60', title: 'Still Mind', description: 'Meditated for 60 total minutes', icon: 'brain' },
    ]
    for (const m of ms) {
      await db.milestone.create({ data: { userId: demo.id, ...m } })
    }

    console.log('Seeded demo user demo@innerpeace.app (password: innerpeace123) with 14 days of history')
  } else {
    console.log('Demo user already exists, skipping demo data')
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
