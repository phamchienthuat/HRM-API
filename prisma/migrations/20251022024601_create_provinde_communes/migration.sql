-- CreateTable
CREATE TABLE "Provinde" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "administrativeLevel" VARCHAR(50) NOT NULL,
    "decree" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "Provinde_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "provinceId" INTEGER NOT NULL,
    "administrativeLevel" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "Communes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provinde_code_key" ON "Provinde"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Communes_code_key" ON "Communes"("code");

-- CreateIndex
CREATE INDEX "Communes_provinceId_idx" ON "Communes"("provinceId");

-- AddForeignKey
ALTER TABLE "Communes" ADD CONSTRAINT "Communes_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Provinde"("id") ON DELETE CASCADE ON UPDATE CASCADE;
