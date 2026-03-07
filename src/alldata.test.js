import { beforeEach, describe, expect, it } from 'vitest';
import {
  addCarRequest,
  addCitizen,
  approveCarRequest,
  carRequests,
  cars,
  citizens,
  rejectCarRequest,
  updateCitizen,
} from './alldata';

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const initialCitizens = deepClone(citizens);
const initialCars = deepClone(cars);

beforeEach(() => {
  citizens.length = 0;
  citizens.push(...deepClone(initialCitizens));

  cars.length = 0;
  cars.push(...deepClone(initialCars));

  carRequests.length = 0;
});

describe('alldata (unit)', () => {
  it('addCitizen (positive): adds a new citizen', () => {
    const before = citizens.length;
    const result = addCitizen({
      idNumber: '999999999',
      name: 'Test User',
      password: '123456',
      phone: '0599000000',
      role: 'driver',
      licenseNumber: 'DL999999',
    });

    expect(citizens.length).toBe(before + 1);
    expect(result).toMatchObject({ idNumber: '999999999', role: 'driver' });
  });

  it('addCitizen (positive): updates existing citizen when idNumber already exists', () => {
    const before = citizens.length;
    const existing = citizens[0];

    const updated = addCitizen({
      idNumber: existing.idNumber,
      phone: '0599123456',
    });

    expect(citizens.length).toBe(before);
    expect(updated.idNumber).toBe(existing.idNumber);
    expect(updated.phone).toBe('0599123456');
  });

  it('updateCitizen (negative): returns null when citizen does not exist', () => {
    expect(updateCitizen('does-not-exist', { phone: '000' })).toBeNull();
  });

  it('car request flow (integration): addCarRequest -> approveCarRequest creates a car', () => {
    const carsBefore = cars.length;
    const request = addCarRequest({
      plateNumber: '99999-9',
      ownerIdNumber: citizens[0].idNumber,
      make: 'TestMake',
      model: 'TestModel',
      year: 2024,
      color: 'Black',
    });

    const createdCar = approveCarRequest(request.id);

    expect(carRequests[0]).toMatchObject({ id: request.id, status: 'approved' });
    expect(cars.length).toBe(carsBefore + 1);
    expect(createdCar).toMatchObject({ plateNumber: '99999-9', make: 'TestMake' });
  });

  it('rejectCarRequest (negative): returns null for missing requestId', () => {
    expect(rejectCarRequest(12345)).toBeNull();
  });
});

