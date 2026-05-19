<?php

namespace App\Entity;

use App\Repository\AppointmentLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AppointmentLogRepository::class)]
class AppointmentLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Appointment::class)]
    #[ORM\JoinColumn(name: "appointment_id", referencedColumnName: "id", onDelete: "CASCADE")]
    private ?Appointment $appointment = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTime $loggedAt = null;

    #[ORM\Column(length: 20)]
    private ?string $actorType = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $action = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $message = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $snapshot = null;

    public function __construct()
    {
        $this->loggedAt = new \DateTime(); // auto timestamp
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAppointment(): ?Appointment
    {
        return $this->appointment;
    }

    public function setAppointment(?Appointment $appointment): self
    {
        $this->appointment = $appointment;
        return $this;
    }

    public function getLoggedAt(): ?\DateTime
    {
        return $this->loggedAt;
    }

    public function setLoggedAt(\DateTime $loggedAt): self
    {
        $this->loggedAt = $loggedAt;
        return $this;
    }

    public function getActorType(): ?string
    {
        return $this->actorType;
    }

    public function setActorType(string $actorType): self
    {
        $this->actorType = $actorType;
        return $this;
    }

    public function getAction(): ?string
    {
        return $this->action;
    }

    public function setAction(?string $action): self
    {
        $this->action = $action;
        return $this;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function setMessage(?string $message): self
    {
        $this->message = $message;
        return $this;
    }

    public function getSnapshot(): ?array
    {
        return $this->snapshot;
    }

    public function setSnapshot(?array $snapshot): self
    {
        $this->snapshot = $snapshot;
        return $this;
    }
}
