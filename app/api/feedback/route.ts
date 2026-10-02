import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { requireAuth, workspaceWhere } from "@/lib/auth";

import { parseFeedbackCsv } from "@/lib/csv";

import { ingestFeedbackBulk, ingestFeedbackItem } from "@/lib/feedback-ingest";

import {

  feedbackBulkSchema,

  feedbackItemSchema,

} from "@/lib/validations/feedback";



export async function GET(request: NextRequest) {

  const session = await requireAuth();

  if (session instanceof NextResponse) {

    return session;

  }



  const { searchParams } = request.nextUrl;

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const pageSize = Math.min(

    50,

    Math.max(1, Number(searchParams.get("pageSize") ?? "15"))

  );

  const channel = searchParams.get("channel") ?? undefined;

  const sentiment = searchParams.get("sentiment") ?? undefined;

  const status = searchParams.get("status") ?? undefined;



  const where = workspaceWhere(session, {

    ...(channel ? { channel: channel as never } : {}),

    ...(sentiment ? { sentiment: sentiment as never } : {}),

    ...(status ? { status: status as never } : {}),

  });



  const [items, total] = await Promise.all([

    prisma.feedback.findMany({

      where,

      orderBy: { createdAt: "desc" },

      skip: (page - 1) * pageSize,

      take: pageSize,

    }),

    prisma.feedback.count({ where }),

  ]);



  return NextResponse.json({

    items,

    pagination: {

      page,

      pageSize,

      total,

      totalPages: Math.ceil(total / pageSize),

    },

  });

}



export async function POST(request: NextRequest) {

  const session = await requireAuth();

  if (session instanceof NextResponse) {

    return session;

  }



  const contentType = request.headers.get("content-type") ?? "";



  if (contentType.includes("multipart/form-data")) {

    const formData = await request.formData();

    const file = formData.get("file");



    if (!(file instanceof File)) {

      return NextResponse.json(

        { error: "CSV file is required under the 'file' field." },

        { status: 400 }

      );

    }



    const csvText = await file.text();

    const rows = parseFeedbackCsv(csvText);



    if (rows.length === 0) {

      return NextResponse.json(

        { error: "CSV must include a header row and at least one data row." },

        { status: 400 }

      );

    }



    const parsed = feedbackBulkSchema.safeParse(

      rows.map((row) => ({

        content: row.content,

        channel: row.channel?.toUpperCase(),

        sentiment: row.sentiment?.toUpperCase(),

        status: row.status?.toUpperCase() || undefined,

      }))

    );



    if (!parsed.success) {

      return NextResponse.json(

        { error: "Invalid CSV data.", details: parsed.error.flatten() },

        { status: 400 }

      );

    }



    const created = await ingestFeedbackBulk(

      parsed.data,

      session.user.workspaceId

    );



    return NextResponse.json(

      { message: "Bulk feedback imported.", count: created.length, items: created },

      { status: 201 }

    );

  }



  let body: unknown;

  try {

    body = await request.json();

  } catch {

    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  }



  if (Array.isArray(body)) {

    const parsed = feedbackBulkSchema.safeParse(body);

    if (!parsed.success) {

      return NextResponse.json(

        { error: "Invalid feedback payload.", details: parsed.error.flatten() },

        { status: 400 }

      );

    }



    const created = await ingestFeedbackBulk(

      parsed.data,

      session.user.workspaceId

    );



    return NextResponse.json(

      { message: "Bulk feedback created.", count: created.length, items: created },

      { status: 201 }

    );

  }



  const parsed = feedbackItemSchema.safeParse(body);

  if (!parsed.success) {

    return NextResponse.json(

      { error: "Invalid feedback payload.", details: parsed.error.flatten() },

      { status: 400 }

    );

  }



  const feedback = await ingestFeedbackItem(

    parsed.data,

    session.user.workspaceId

  );



  return NextResponse.json(feedback, { status: 201 });

}

