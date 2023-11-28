import * as fs from 'fs';
import { sequence } from 'ramda';
import { parse } from 'csv-parse';
import cliProgress from 'cli-progress';

const cartesianProduct = sequence(Array.of)

enum DayOfTheWeek {
    Lunes,
    Martes,
    Miercoles,
    Jueves,
    Viernes,
    Sabado,
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

const commutePenalty = 0.001;

function hasOverlap(clases: Clase[]): boolean {
    return clases.slice(0, -1).some((c1: Clase, index: number) =>
        c1.endHour > clases[index+1].startHour)
}

function countCommutes(clases: Clase[]): number {
    const presencial = clases.filter((c: Clase) => c.location !== ClaseLocation.Remoto)
    return presencial.length - presencial.slice(0, -1).filter((c1: Clase, index: number) =>
        c1.endHour === presencial[index+1].startHour && c1.location === presencial[index+1].location
        ).length
}

function utilidad(materias: MateriaOpcion[]): number {
    const times: { [key in DayOfTheWeek]: Clase[] } = {
        [DayOfTheWeek.Lunes]: [],
        [DayOfTheWeek.Martes]: [],
        [DayOfTheWeek.Miercoles]: [],
        [DayOfTheWeek.Jueves]: [],
        [DayOfTheWeek.Viernes]: [],
        [DayOfTheWeek.Sabado]: [],
    }
    materias.forEach((m: MateriaOpcion) => {
        m.cursada.forEach((c: Clase) => {
            times[c.dow].push(c);
        })
    })
    Object.values(times).forEach((clases: Clase[]) => 
        clases.sort((a: Clase, b: Clase) => a.startHour - b.startHour));
    if (Object.values(times).some(hasOverlap)) {
        return -Infinity;
    }
    const score = materias.map((m: MateriaOpcion) => m.puntuacion).reduce((p: number, val: number) => val + p, 0);
    const commute = Object.values(times).map(countCommutes).reduce((p: number, val: number) => val + p, 0);
    return score - commute * commutePenalty;
}

function parseDias(d: string): DayOfTheWeek[] {
    if (d.length === 0) return [];
    return d.split('/').map((v) => ({
        Lu: DayOfTheWeek.Lunes,
        Ma: DayOfTheWeek.Martes,
        Mi: DayOfTheWeek.Miercoles,
        Ju: DayOfTheWeek.Jueves,
        Vi: DayOfTheWeek.Viernes,
        Sa: DayOfTheWeek.Sabado,
    }[v]));
}

function parseHora(h: string): [number, number] | undefined {
    const res = h.split(' a ').map((x: string) => parseFloat(x))
    if (res.length === 2) {
        return [res[0], res[1]]
    }
    return undefined;
}

function parseCursada(row: any, d: string, t: string, location: ClaseLocation) {
    const days = parseDias(row[d]);
    const time = parseHora(row[t]);
    if ((days.length === 0) !== (time === undefined)) {
        throw new Error('Timedate parse failed: ' + JSON.stringify(row))
    }
    return days.map((d) => ({
        dow: d,
        startHour: time[0],
        endHour: time[1],
        location,
    }));
}

const parser = parse({delimiter: ',', columns: true}, function(err, data) {
    if (err) {
        throw err;
    }

    const grupos: { [key: string]: Grupos } = {}

    data.forEach((row: any) => {
        if (row.Grupo === '0') return;
        const cursada = [];
        cursada.push(...parseCursada(row, 'Días economicas', 'Horario economicas', ClaseLocation.Economicas));
        cursada.push(...parseCursada(row, 'Días online', 'Horario online', ClaseLocation.Remoto));
        cursada.push(...parseCursada(row, 'Días derecho', 'Horario derecho', ClaseLocation.Derecho));
        if (!grupos[row.Grupo]) grupos[row.Grupo] = {opciones: []};
        grupos[row.Grupo].opciones.push({
            id: `${row.Materia} (${row.Docente})`,
            cursada,
            puntuacion: parseFloat(row.Puntaje),
        })
    })

    console.log('Processing options...')
    const options = cartesianProduct(Object.values(grupos).map((g) => g.opciones));
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar1.start(options.length, 0);
    const optionsUtility = options.map((o: MateriaOpcion[], index: number) => {
        bar1.update(index);
        return utilidad(o);
    });
    bar1.stop();
    const max = optionsUtility.reduce((val: number, val2: number) => Math.max(val, val2), -Infinity);
    console.log({max, best: JSON.stringify(options[optionsUtility.indexOf(max)])})
});
const inputFile = 'oferta.csv';
fs.createReadStream(inputFile).pipe(parser);
