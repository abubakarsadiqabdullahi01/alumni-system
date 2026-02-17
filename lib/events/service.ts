import { prisma } from "@/lib/prisma";

export type MemberEventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  city: string | null;
  startAt: Date;
  endAt: Date | null;
  capacity: number | null;
  status: string;
  rsvpCount: number;
  isGoing: boolean;
};

type RawMemberEventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  city: string | null;
  startAt: Date;
  endAt: Date | null;
  capacity: number | null;
  status: string;
  rsvpCount: bigint;
  isGoing: boolean;
};

let ensured = false;

async function ensureEventsTables() {
  if (ensured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NULL,
      location TEXT NULL,
      city TEXT NULL,
      start_at TIMESTAMP NOT NULL,
      end_at TIMESTAMP NULL,
      capacity INTEGER NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_by TEXT NULL REFERENCES "User"(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS event_rsvps (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      alumni_id TEXT NOT NULL REFERENCES "Alumni"(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'GOING',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE(event_id, alumni_id)
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_events_city ON events(city)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_rsvps_alumni_id ON event_rsvps(alumni_id)`);

  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM events
  `;
  const count = rows.length > 0 ? Number(rows[0].count) : 0;

  if (count === 0) {
    const now = new Date();
    const eventAStart = new Date(now);
    eventAStart.setDate(now.getDate() + 7);
    eventAStart.setHours(11, 0, 0, 0);

    const eventBStart = new Date(now);
    eventBStart.setDate(now.getDate() + 16);
    eventBStart.setHours(15, 0, 0, 0);

    const eventCStart = new Date(now);
    eventCStart.setDate(now.getDate() + 25);
    eventCStart.setHours(9, 30, 0, 0);

    await prisma.$executeRaw`
      INSERT INTO events (id, title, description, location, city, start_at, capacity, status)
      VALUES (
        ${crypto.randomUUID()},
        'Alumni Career Mixer',
        'A focused networking mixer for alumni hiring and partnerships.',
        'Innovation Hall',
        'Atlanta',
        ${eventAStart},
        120,
        'OPEN'
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO events (id, title, description, location, city, start_at, capacity, status)
      VALUES (
        ${crypto.randomUUID()},
        'Founder Stories Panel',
        'Executive panel with alumni founders sharing growth lessons.',
        'Auditorium A',
        'Savannah',
        ${eventBStart},
        80,
        'OPEN'
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO events (id, title, description, location, city, start_at, capacity, status)
      VALUES (
        ${crypto.randomUUID()},
        'Tech Leadership Workshop',
        'Hands-on workshop on leadership, strategy, and hiring for senior roles.',
        'Business Center',
        'Atlanta',
        ${eventCStart},
        60,
        'OPEN'
      )
    `;
  }

  ensured = true;
}

function mapEventRow(row: RawMemberEventRow): MemberEventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    city: row.city,
    startAt: new Date(row.startAt),
    endAt: row.endAt ? new Date(row.endAt) : null,
    capacity: row.capacity,
    status: row.status,
    rsvpCount: Number(row.rsvpCount),
    isGoing: row.isGoing,
  };
}

export async function getMemberEventsData(alumniId: string, filter?: { q?: string; city?: string }) {
  await ensureEventsTables();

  const rawEvents = await prisma.$queryRaw<RawMemberEventRow[]>`
    SELECT
      e.id,
      e.title,
      e.description,
      e.location,
      e.city,
      e.start_at AS "startAt",
      e.end_at AS "endAt",
      e.capacity,
      e.status,
      COALESCE(r.cnt, 0)::bigint AS "rsvpCount",
      EXISTS(
        SELECT 1
        FROM event_rsvps me
        WHERE me.event_id = e.id
          AND me.alumni_id = ${alumniId}
      ) AS "isGoing"
    FROM events e
    LEFT JOIN (
      SELECT event_id, COUNT(*)::bigint AS cnt
      FROM event_rsvps
      GROUP BY event_id
    ) r ON r.event_id = e.id
    WHERE e.start_at >= NOW() - INTERVAL '1 day'
      AND e.status <> 'CANCELLED'
    ORDER BY e.start_at ASC
    LIMIT 150
  `;

  const allEvents = rawEvents.map(mapEventRow);
  const q = filter?.q?.trim().toLowerCase() ?? "";
  const city = filter?.city?.trim().toLowerCase() ?? "";

  const events = allEvents.filter((item) => {
    if (city && (item.city ?? "").toLowerCase() !== city) return false;
    if (
      q &&
      ![
        item.title,
        item.description ?? "",
        item.location ?? "",
        item.city ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    ) {
      return false;
    }
    return true;
  });

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  return {
    events,
    cities: Array.from(new Set(allEvents.map((item) => item.city).filter(Boolean) as string[])).sort(),
    stats: {
      upcomingEvents: allEvents.length,
      myRsvps: allEvents.filter((item) => item.isGoing).length,
      thisMonthEvents: allEvents.filter(
        (item) => item.startAt.getMonth() === thisMonth && item.startAt.getFullYear() === thisYear,
      ).length,
    },
  };
}

export async function rsvpToEvent(alumniId: string, eventId: string) {
  await ensureEventsTables();

  const rows = await prisma.$queryRaw<Array<{ capacity: number | null; rsvpCount: bigint; status: string }>>`
    SELECT
      e.capacity AS capacity,
      COALESCE(r.cnt, 0)::bigint AS "rsvpCount",
      e.status AS status
    FROM events e
    LEFT JOIN (
      SELECT event_id, COUNT(*)::bigint AS cnt
      FROM event_rsvps
      GROUP BY event_id
    ) r ON r.event_id = e.id
    WHERE e.id = ${eventId}
      AND e.start_at >= NOW() - INTERVAL '1 day'
    LIMIT 1
  `;

  if (rows.length === 0) {
    return { ok: false, error: "Event not found or already closed." };
  }

  const row = rows[0];
  if (row.status === "CANCELLED" || row.status === "CLOSED") {
    return { ok: false, error: "This event is not accepting RSVPs." };
  }

  if (row.capacity !== null && Number(row.rsvpCount) >= row.capacity) {
    return { ok: false, error: "Event capacity reached." };
  }

  await prisma.$executeRaw`
    INSERT INTO event_rsvps (id, event_id, alumni_id, status, created_at)
    VALUES (${crypto.randomUUID()}, ${eventId}, ${alumniId}, 'GOING', NOW())
    ON CONFLICT (event_id, alumni_id)
    DO NOTHING
  `;

  return { ok: true };
}

export async function cancelEventRsvp(alumniId: string, eventId: string) {
  await ensureEventsTables();
  await prisma.$executeRaw`
    DELETE FROM event_rsvps
    WHERE event_id = ${eventId}
      AND alumni_id = ${alumniId}
  `;
  return { ok: true };
}

