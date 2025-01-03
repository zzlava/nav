import { NextResponse } from 'next/server'
import { deleteAllSites } from '@/lib/sanity'

export async function DELETE(req: Request) {
  try {
    const count = await deleteAllSites();
    return NextResponse.json({ 
      success: true,
      count
    });
  } catch (error) {
    console.error('删除失败:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '删除失败' 
    }, { 
      status: 500 
    });
  }
} 