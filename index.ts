import { sequence } from 'ramda';
const cartesianProduct = sequence(Array.of)

enum DayOfTheWeek {
    Lunes,
    Martes,
    Miercoles,
    Jueves,
    Viernes,
}

enum ClaseLocation {
    Economicas,
    Derecho,
    Remoto,
}

interface Clase {
    dow: DayOfTheWeek;
    startHour: number;
    endHour: number;
    location: ClaseLocation;
}

interface MateriaOpcion {
    id: string;
    cursada: Clase[];
    puntuacion: number;
}

interface Grupos {
    opciones: MateriaOpcion[];
}

const grupos: Grupos[] = [
    {
        opciones: [
            {
                id: "Laboral opción 1",
                cursada: [
                    {
                        dow: DayOfTheWeek.Lunes,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                    {
                        dow: DayOfTheWeek.Jueves,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                ],
                puntuacion: 5,
            },
            {
                id: "Laboral opción 2",
                cursada: [
                    {
                        dow: DayOfTheWeek.Lunes,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                    {
                        dow: DayOfTheWeek.Jueves,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                ],
                puntuacion: 4,
            },
        ]
    },
    {
        opciones: [
            {
                id: "Sociedades opción 1",
                cursada: [
                    {
                        dow: DayOfTheWeek.Martes,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                    {
                        dow: DayOfTheWeek.Viernes,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                ],
                puntuacion: 5,
            },
            {
                id: "Sociedades opción 2",
                cursada: [
                    {
                        dow: DayOfTheWeek.Lunes,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                    {
                        dow: DayOfTheWeek.Jueves,
                        startHour: 7,
                        endHour: 8.5,
                        location: ClaseLocation.Derecho,
                    },
                ],
                puntuacion: 4,
            },
        ]
    },
];

function hasOverlap(clases: Clase[]): boolean {
    return clases.slice(0, -1).some((c1: Clase, index: number) =>
        c1.endHour > clases[index+1].startHour)
}

function utilidad(materias: MateriaOpcion[]): number | undefined {
    const times: { [key in DayOfTheWeek]: Clase[] } = {
        [DayOfTheWeek.Lunes]: [],
        [DayOfTheWeek.Martes]: [],
        [DayOfTheWeek.Miercoles]: [],
        [DayOfTheWeek.Jueves]: [],
        [DayOfTheWeek.Viernes]: [],
    }
    materias.forEach((m: MateriaOpcion) => {
        m.cursada.forEach((c: Clase) => {
            times[c.dow].push(c);
        })
    })
    Object.values(times).forEach((clases: Clase[]) => 
        clases.sort((a: Clase, b: Clase) => a.startHour - b.startHour));
    if (Object.values(times).some(hasOverlap)) {
        return undefined;
    }
    let score: number = materias.map((m: MateriaOpcion) => m.puntuacion).reduce((p: number, val: number) => val + p, 0);
    return score;
}

const options = cartesianProduct(grupos.map((g) => g.opciones));
console.log(options.map(utilidad));