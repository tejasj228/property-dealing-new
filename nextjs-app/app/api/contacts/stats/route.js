import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Contact from '@/lib/models/Contact';
import { authenticateToken } from '@/lib/auth';

export async function GET(request) {
  const { admin, error, status } = authenticateToken(request);
  if (error) return NextResponse.json({ success: false, message: error }, { status });

  try {
    await connectDB();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalContacts, unreadCount, newCount, recentCount, statusCounts, priorityCounts] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ isRead: false }),
      Contact.countDocuments({ status: 'new' }),
      Contact.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Contact.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Contact.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalContacts,
        unreadCount,
        newCount,
        recentCount,
        statusCounts: statusCounts.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
        priorityCounts: priorityCounts.reduce((acc, curr) => { acc[curr._id] = curr.count; return acc; }, {}),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error fetching stats', error: error.message }, { status: 500 });
  }
}
