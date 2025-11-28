
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile, getFileUrl } from '@/lib/s3';

// GET: Obtener fotos de un modelo específico
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const make = searchParams.get('make');
    const model = searchParams.get('model');

    if (!make || !model) {
      return NextResponse.json(
        { error: 'Se requiere marca y modelo' },
        { status: 400 }
      );
    }

    // Buscar fotos que coincidan exactamente o que el modelo contenga la búsqueda
    const photos = await prisma.vehicleModelPhotos.findMany({
      where: {
        AND: [
          {
            make: {
              equals: make.toUpperCase(),
              mode: 'insensitive'
            }
          },
          {
            OR: [
              {
                model: {
                  equals: model.toUpperCase(),
                  mode: 'insensitive'
                }
              },
              {
                model: {
                  startsWith: model.toUpperCase(),
                  mode: 'insensitive'
                }
              },
              {
                model: {
                  contains: model.toUpperCase(),
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      orderBy: [
        { is_primary: 'desc' }, // Foto principal primero
        { photo_order: 'asc' }
      ]
    });

    // Generar URLs firmadas para cada foto
    const photosWithSignedUrls = await Promise.all(
      photos.map(async (photo) => {
        try {
          const signedUrl = await getFileUrl(photo.photo_url, 604800); // 7 días
          return {
            ...photo,
            photo_url: signedUrl // Reemplazar key por URL firmada
          };
        } catch (error) {
          console.error(`Error generando URL para foto ${photo.id}:`, error);
          return photo; // Devolver foto original si falla
        }
      })
    );

    return NextResponse.json(photosWithSignedUrls);
  } catch (error) {
    console.error('Error obteniendo fotos del modelo:', error);
    return NextResponse.json(
      { error: 'Error obteniendo fotos del modelo' },
      { status: 500 }
    );
  }
}

// POST: Subir nueva foto para un modelo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const isPrimary = formData.get('is_primary') === 'true';

    if (!file || !make || !model) {
      return NextResponse.json(
        { error: 'Se requiere archivo, marca y modelo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos de imagen' },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único para el archivo
    const fileName = `vehicle-models/${make.toUpperCase()}/${model.toUpperCase()}/${Date.now()}-${file.name}`;

    // Subir a S3
    const photoUrl = await uploadFile(buffer, fileName);

    // Si es foto principal, quitar el flag de las demás
    if (isPrimary) {
      await prisma.vehicleModelPhotos.updateMany({
        where: {
          make: make.toUpperCase(),
          model: model.toUpperCase(),
          is_primary: true
        },
        data: {
          is_primary: false
        }
      });
    }

    // Obtener el siguiente número de orden
    const maxOrder = await prisma.vehicleModelPhotos.findFirst({
      where: {
        make: make.toUpperCase(),
        model: model.toUpperCase(),
      },
      orderBy: {
        photo_order: 'desc'
      },
      select: {
        photo_order: true
      }
    });

    const nextOrder = (maxOrder?.photo_order || 0) + 1;

    // Guardar en BD
    const photo = await prisma.vehicleModelPhotos.create({
      data: {
        make: make.toUpperCase(),
        model: model.toUpperCase(),
        photo_url: photoUrl,
        photo_order: nextOrder,
        is_primary: isPrimary,
        created_by: parseInt(session.user.id)
      }
    });

    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error subiendo foto:', error);
    return NextResponse.json(
      { error: 'Error subiendo foto' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar foto de un modelo
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere ID de la foto' },
        { status: 400 }
      );
    }

    // Obtener la foto para eliminar de S3
    const photo = await prisma.vehicleModelPhotos.findUnique({
      where: { id: parseInt(id) }
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Foto no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar de S3
    try {
      await deleteFile(photo.photo_url);
    } catch (s3Error) {
      console.error('Error eliminando de S3:', s3Error);
      // Continuar aunque falle S3
    }

    // Eliminar de BD
    await prisma.vehicleModelPhotos.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Foto eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando foto:', error);
    return NextResponse.json(
      { error: 'Error eliminando foto' },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar orden o foto principal
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_primary, photo_order } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere ID de la foto' },
        { status: 400 }
      );
    }

    // Si se marca como principal, quitar el flag de las demás
    if (is_primary === true) {
      const photo = await prisma.vehicleModelPhotos.findUnique({
        where: { id: parseInt(id) }
      });

      if (photo) {
        await prisma.vehicleModelPhotos.updateMany({
          where: {
            make: photo.make,
            model: photo.model,
            is_primary: true
          },
          data: {
            is_primary: false
          }
        });
      }
    }

    // Actualizar la foto
    const updatedPhoto = await prisma.vehicleModelPhotos.update({
      where: { id: parseInt(id) },
      data: {
        ...(is_primary !== undefined && { is_primary }),
        ...(photo_order !== undefined && { photo_order })
      }
    });

    return NextResponse.json(updatedPhoto);
  } catch (error) {
    console.error('Error actualizando foto:', error);
    return NextResponse.json(
      { error: 'Error actualizando foto' },
      { status: 500 }
    );
  }
}
